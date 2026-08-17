package com.dialtec.product_service.service;

import com.dialtec.product_service.client.MediaServiceFeignClient;
import com.dialtec.product_service.client.UserServiceFeignClient;
import com.dialtec.product_service.dto.request.AjouterImageRequest;
import com.dialtec.product_service.dto.request.GenerationRequest;
import com.dialtec.product_service.dto.request.ProduitUpdateRequest;
import com.dialtec.product_service.dto.request.StockUpdateRequest;
import com.dialtec.product_service.dto.response.ProduitResponse;
import com.dialtec.product_service.dto.response.PublicProduitResponse;
import com.dialtec.product_service.entity.Produit;
import com.dialtec.product_service.entity.ProduitImage;
import com.dialtec.product_service.enums.AccountStatus;
import com.dialtec.product_service.enums.StatutFiche;
import com.dialtec.product_service.exception.CompteNonActifException;
import com.dialtec.product_service.exception.ProduitNotFoundException;
import com.dialtec.product_service.exception.ServiceIndisponibleException;
import com.dialtec.product_service.exception.UnauthorizedProduitAccessException;
import com.dialtec.product_service.mapper.ProduitMapper;
import com.dialtec.product_service.messaging.ProduitGenerationPublisher;
import com.dialtec.product_service.repository.ProduitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProduitServiceImplTest {

    @Mock
    private ProduitRepository produitRepository;
    @Mock
    private ProduitMapper produitMapper;
    @Mock
    private ProduitGenerationPublisher produitGenerationPublisher;
    @Mock
    private UserServiceFeignClient userServiceFeignClient;
    @Mock
    private MediaServiceFeignClient mediaServiceFeignClient;

    @InjectMocks
    private ProduitServiceImpl produitService;

    private UUID commercantId;
    private UUID produitId;
    private Produit produit;

    @BeforeEach
    void setUp() {
        commercantId = UUID.randomUUID();
        produitId = UUID.randomUUID();
        produit = Produit.builder()
                .id(produitId)
                .commercantId(commercantId)
                .nom("Détergent multi-usage")
                .statut(StatutFiche.EN_ATTENTE_VALIDATION)
                .quantite(0)
                .seuilAlerte(5)
                .build();
    }

    // --- initierGeneration ---

    @Test
    void initierGeneration_quandFeignEchoue_leveServiceIndisponibleException() {
        GenerationRequest request = GenerationRequest.builder()
                .photoUrl("photo.jpg").photoKey("key1").audioUrl("audio.m4a").audioKey("key2").build();

        when(userServiceFeignClient.getAccountStatus(commercantId)).thenThrow(new RuntimeException("timeout"));

        assertThatThrownBy(() -> produitService.initierGeneration(commercantId, request))
                .isInstanceOf(ServiceIndisponibleException.class);

        verify(produitGenerationPublisher, never()).publishGenerationRequest(any(), any(), any(), any(), any());
    }

    @Test
    void initierGeneration_quandCompteNonActif_leveCompteNonActifException() {
        GenerationRequest request = GenerationRequest.builder()
                .photoUrl("photo.jpg").photoKey("key1").audioUrl("audio.m4a").audioKey("key2").build();

        when(userServiceFeignClient.getAccountStatus(commercantId)).thenReturn(AccountStatus.BLOQUE);

        assertThatThrownBy(() -> produitService.initierGeneration(commercantId, request))
                .isInstanceOf(CompteNonActifException.class);

        verify(produitGenerationPublisher, never()).publishGenerationRequest(any(), any(), any(), any(), any());
    }

    @Test
    void initierGeneration_succes_publieLaDemandeEtRetourneUnId() {
        GenerationRequest request = GenerationRequest.builder()
                .photoUrl("photo.jpg").photoKey("key1").audioUrl("audio.m4a").audioKey("key2").build();
        UUID generationId = UUID.randomUUID();

        when(userServiceFeignClient.getAccountStatus(commercantId)).thenReturn(AccountStatus.ACTIF);
        when(produitGenerationPublisher.publishGenerationRequest(
                commercantId, "photo.jpg", "key1", "audio.m4a", "key2")).thenReturn(generationId);

        UUID result = produitService.initierGeneration(commercantId, request);

        assertThat(result).isEqualTo(generationId);
    }

    // --- consulterParGenerationId ---

    @Test
    void consulterParGenerationId_quandIntrouvable_leveProduitNotFoundException() {
        UUID generationId = UUID.randomUUID();
        when(produitRepository.findByGenerationId(generationId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> produitService.consulterParGenerationId(commercantId, generationId))
                .isInstanceOf(ProduitNotFoundException.class);
    }

    @Test
    void consulterParGenerationId_quandNAppartientPasAuCommercant_leveUnauthorizedProduitAccessException() {
        UUID generationId = UUID.randomUUID();
        UUID autreCommercantId = UUID.randomUUID();
        produit.setCommercantId(autreCommercantId);

        when(produitRepository.findByGenerationId(generationId)).thenReturn(Optional.of(produit));

        assertThatThrownBy(() -> produitService.consulterParGenerationId(commercantId, generationId))
                .isInstanceOf(UnauthorizedProduitAccessException.class);
    }

    @Test
    void consulterParGenerationId_succes_retourneLeProduitMappe() {
        UUID generationId = UUID.randomUUID();
        ProduitResponse expected = ProduitResponse.builder().id(produitId).build();

        when(produitRepository.findByGenerationId(generationId)).thenReturn(Optional.of(produit));
        when(produitMapper.toProduitResponse(produit)).thenReturn(expected);

        ProduitResponse result = produitService.consulterParGenerationId(commercantId, generationId);

        assertThat(result).isEqualTo(expected);
    }

    // --- listerMesProduits ---

    @Test
    void listerMesProduits_avecNom_filtreParNom() {
        Pageable pageable = Pageable.unpaged();
        Page<Produit> page = new PageImpl<>(List.of(produit));

        when(produitRepository.findByCommercantIdAndNomContainingIgnoreCase(commercantId, "détergent", pageable))
                .thenReturn(page);
        when(produitMapper.toProduitResponse(produit)).thenReturn(ProduitResponse.builder().id(produitId).build());

        Page<ProduitResponse> result = produitService.listerMesProduits(commercantId, "détergent", null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void listerMesProduits_sansFiltre_retourneToutLeCatalogueDuCommercant() {
        Pageable pageable = Pageable.unpaged();
        Page<Produit> page = new PageImpl<>(List.of(produit));

        when(produitRepository.findByCommercantId(commercantId, pageable)).thenReturn(page);
        when(produitMapper.toProduitResponse(produit)).thenReturn(ProduitResponse.builder().id(produitId).build());

        Page<ProduitResponse> result = produitService.listerMesProduits(commercantId, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    // --- consulterMonProduit ---

    @Test
    void consulterMonProduit_quandIntrouvable_leveProduitNotFoundException() {
        when(produitRepository.findById(produitId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> produitService.consulterMonProduit(commercantId, produitId))
                .isInstanceOf(ProduitNotFoundException.class);
    }

    @Test
    void consulterMonProduit_quandNAppartientPasAuCommercant_leveUnauthorizedProduitAccessException() {
        UUID autreCommercantId = UUID.randomUUID();
        produit.setCommercantId(autreCommercantId);

        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));

        assertThatThrownBy(() -> produitService.consulterMonProduit(commercantId, produitId))
                .isInstanceOf(UnauthorizedProduitAccessException.class);
    }

    @Test
    void consulterMonProduit_succes_retourneLeProduitMappe() {
        ProduitResponse expected = ProduitResponse.builder().id(produitId).build();
        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));
        when(produitMapper.toProduitResponse(produit)).thenReturn(expected);

        ProduitResponse result = produitService.consulterMonProduit(commercantId, produitId);

        assertThat(result).isEqualTo(expected);
    }

    // --- modifierMonProduit ---

    @Test
    void modifierMonProduit_quandNAppartientPasAuCommercant_leveUnauthorizedProduitAccessException() {
        UUID autreCommercantId = UUID.randomUUID();
        produit.setCommercantId(autreCommercantId);
        ProduitUpdateRequest request = ProduitUpdateRequest.builder().build();

        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));

        assertThatThrownBy(() -> produitService.modifierMonProduit(commercantId, produitId, request))
                .isInstanceOf(UnauthorizedProduitAccessException.class);
    }

    @Test
    void modifierMonProduit_succes_appliqueLaMiseAJourEtSauvegarde() {
        ProduitUpdateRequest request = ProduitUpdateRequest.builder().build();
        ProduitResponse expected = ProduitResponse.builder().id(produitId).build();

        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));
        when(produitMapper.toProduitResponse(produit)).thenReturn(expected);

        ProduitResponse result = produitService.modifierMonProduit(commercantId, produitId, request);

        verify(produitMapper).applyUpdate(produit, request);
        verify(produitRepository).save(produit);
        assertThat(result).isEqualTo(expected);
    }

    // --- validerMaFiche ---

    @Test
    void validerMaFiche_succes_passeLeStatutAValidee() {
        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));
        when(produitMapper.toProduitResponse(produit)).thenReturn(ProduitResponse.builder().id(produitId).build());

        produitService.validerMaFiche(commercantId, produitId);

        assertThat(produit.getStatut()).isEqualTo(StatutFiche.VALIDEE);
        verify(produitRepository).save(produit);
    }

    // --- mettreAJourStock ---

    @Test
    void mettreAJourStock_succes_appliqueLaMiseAJourEtSauvegarde() {
        StockUpdateRequest request = StockUpdateRequest.builder().quantite(10).seuilAlerte(3).build();
        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));
        when(produitMapper.toProduitResponse(produit)).thenReturn(ProduitResponse.builder().id(produitId).build());

        produitService.mettreAJourStock(commercantId, produitId, request);

        verify(produitMapper).applyStockUpdate(produit, request);
        verify(produitRepository).save(produit);
    }

    // --- supprimerMonProduit ---

    @Test
    void supprimerMonProduit_succes_supprimeEtNettoieLesFichiersEnBestEffort() {
        ProduitImage image1 = ProduitImage.builder().key("key-image-1").build();
        ProduitImage image2 = ProduitImage.builder().key("key-image-2").build();
        produit.setImages(new java.util.ArrayList<>(List.of(image1, image2)));

        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));

        produitService.supprimerMonProduit(commercantId, produitId);

        verify(produitRepository).delete(produit);
        verify(mediaServiceFeignClient).deleteFile("key-image-1");
        verify(mediaServiceFeignClient).deleteFile("key-image-2");
    }

    @Test
    void supprimerMonProduit_quandMediaServiceEchoue_neBloquePasLaSuppressionDejaFaite() {
        ProduitImage image = ProduitImage.builder().key("key-image").build();
        produit.setImages(new java.util.ArrayList<>(List.of(image)));

        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));
        doThrow(new RuntimeException("media-service injoignable"))
                .when(mediaServiceFeignClient).deleteFile("key-image");

        // Ne doit lever AUCUNE exception : la suppression en base est déjà
        // faite, l'échec de nettoyage du fichier physique est volontairement
        // avalé (best-effort), voir le commentaire de la méthode réelle.
        produitService.supprimerMonProduit(commercantId, produitId);

        verify(produitRepository).delete(produit);
    }

    // --- ajouterImage ---

    @Test
    void ajouterImage_quandCEstLaPremiereImage_laMarqueCommePrincipale() {
        AjouterImageRequest request = AjouterImageRequest.builder()
                .imageUrl("nouvelle.jpg").imageKey("nouvelle-key").build();

        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));
        when(produitMapper.toProduitResponse(produit)).thenReturn(ProduitResponse.builder().id(produitId).build());

        produitService.ajouterImage(commercantId, produitId, request);

        assertThat(produit.getImages()).hasSize(1);
        assertThat(produit.getImages().get(0).isEstPrincipale()).isTrue();
    }

    @Test
    void ajouterImage_quandDesImagesExistentDeja_neLaMarquePasPrincipale() {
        produit.getImages().add(ProduitImage.builder().key("existante").estPrincipale(true).build());
        AjouterImageRequest request = AjouterImageRequest.builder()
                .imageUrl("nouvelle.jpg").imageKey("nouvelle-key").build();

        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));
        when(produitMapper.toProduitResponse(produit)).thenReturn(ProduitResponse.builder().id(produitId).build());

        produitService.ajouterImage(commercantId, produitId, request);

        assertThat(produit.getImages()).hasSize(2);
        assertThat(produit.getImages().get(1).isEstPrincipale()).isFalse();
    }

    // --- supprimerImage ---

    @Test
    void supprimerImage_quandImageIntrouvable_leveProduitNotFoundException() {
        UUID imageId = UUID.randomUUID();
        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));

        assertThatThrownBy(() -> produitService.supprimerImage(commercantId, produitId, imageId))
                .isInstanceOf(ProduitNotFoundException.class);
    }

    @Test
    void supprimerImage_succes_retireLImageEtNettoieLeFichier() {
        UUID imageId = UUID.randomUUID();
        ProduitImage image = ProduitImage.builder().id(imageId).key("key-a-supprimer").build();
        produit.getImages().add(image);

        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));
        when(produitMapper.toProduitResponse(produit)).thenReturn(ProduitResponse.builder().id(produitId).build());

        produitService.supprimerImage(commercantId, produitId, imageId);

        assertThat(produit.getImages()).isEmpty();
        verify(mediaServiceFeignClient).deleteFile("key-a-supprimer");
    }

    // --- listerCataloguePublic ---

    @Test
    void listerCataloguePublic_avecNom_filtreParNomEtStatutValidee() {
        Pageable pageable = Pageable.unpaged();
        Page<Produit> page = new PageImpl<>(List.of(produit));

        when(produitRepository.findByStatutAndNomContainingIgnoreCase(StatutFiche.VALIDEE, "détergent", pageable))
                .thenReturn(page);
        when(produitMapper.toPublicProduitResponse(produit)).thenReturn(PublicProduitResponse.builder().id(produitId).build());

        Page<PublicProduitResponse> result = produitService.listerCataloguePublic("détergent", null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void listerCataloguePublic_sansFiltre_retourneTousLesValides() {
        Pageable pageable = Pageable.unpaged();
        Page<Produit> page = new PageImpl<>(List.of(produit));

        when(produitRepository.findByStatut(StatutFiche.VALIDEE, pageable)).thenReturn(page);
        when(produitMapper.toPublicProduitResponse(produit)).thenReturn(PublicProduitResponse.builder().id(produitId).build());

        Page<PublicProduitResponse> result = produitService.listerCataloguePublic(null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    // --- listerCatalogueParCommercant ---

    @Test
    void listerCatalogueParCommercant_avecCategorie_filtreParCategorie() {
        Pageable pageable = Pageable.unpaged();
        Page<Produit> page = new PageImpl<>(List.of(produit));

        when(produitRepository.findByStatutAndCommercantIdAndCategorieIgnoreCase(
                StatutFiche.VALIDEE, commercantId, "Droguerie", pageable)).thenReturn(page);
        when(produitMapper.toPublicProduitResponse(produit)).thenReturn(PublicProduitResponse.builder().id(produitId).build());

        Page<PublicProduitResponse> result = produitService.listerCatalogueParCommercant(commercantId, "Droguerie", pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void listerCatalogueParCommercant_sansCategorie_retourneToutSonCatalogueValide() {
        Pageable pageable = Pageable.unpaged();
        Page<Produit> page = new PageImpl<>(List.of(produit));

        when(produitRepository.findByStatutAndCommercantId(StatutFiche.VALIDEE, commercantId, pageable)).thenReturn(page);
        when(produitMapper.toPublicProduitResponse(produit)).thenReturn(PublicProduitResponse.builder().id(produitId).build());

        Page<PublicProduitResponse> result = produitService.listerCatalogueParCommercant(commercantId, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    // --- listerNouveautesDeMesFournisseurs ---

    @Test
    void listerNouveautesDeMesFournisseurs_quandAucunFournisseur_retournePageVideSansAppelerLeRepository() {
        UUID clientId = UUID.randomUUID();
        Pageable pageable = Pageable.unpaged();

        when(userServiceFeignClient.getFournisseurIds(clientId)).thenReturn(List.of());

        Page<PublicProduitResponse> result = produitService.listerNouveautesDeMesFournisseurs(clientId, pageable);

        assertThat(result.getContent()).isEmpty();
        verify(produitRepository, never()).findByStatutAndCommercantIdIn(any(), any(), any());
    }

    @Test
    void listerNouveautesDeMesFournisseurs_avecFournisseurs_interrogeLeRepository() {
        UUID clientId = UUID.randomUUID();
        Pageable pageable = Pageable.unpaged();
        List<UUID> fournisseurIds = List.of(commercantId);
        Page<Produit> page = new PageImpl<>(List.of(produit));

        when(userServiceFeignClient.getFournisseurIds(clientId)).thenReturn(fournisseurIds);
        when(produitRepository.findByStatutAndCommercantIdIn(StatutFiche.VALIDEE, fournisseurIds, pageable))
                .thenReturn(page);
        when(produitMapper.toPublicProduitResponse(produit)).thenReturn(PublicProduitResponse.builder().id(produitId).build());

        Page<PublicProduitResponse> result = produitService.listerNouveautesDeMesFournisseurs(clientId, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    // --- consulterProduitPublic ---

    @Test
    void consulterProduitPublic_quandIntrouvable_leveProduitNotFoundException() {
        when(produitRepository.findById(produitId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> produitService.consulterProduitPublic(produitId))
                .isInstanceOf(ProduitNotFoundException.class);
    }

    @Test
    void consulterProduitPublic_quandPasEncoreValide_leveProduitNotFoundException() {
        produit.setStatut(StatutFiche.EN_ATTENTE_VALIDATION);
        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));

        assertThatThrownBy(() -> produitService.consulterProduitPublic(produitId))
                .isInstanceOf(ProduitNotFoundException.class);
    }

    @Test
    void consulterProduitPublic_succes_retourneLeProduitMappe() {
        produit.setStatut(StatutFiche.VALIDEE);
        PublicProduitResponse expected = PublicProduitResponse.builder().id(produitId).build();

        when(produitRepository.findById(produitId)).thenReturn(Optional.of(produit));
        when(produitMapper.toPublicProduitResponse(produit)).thenReturn(expected);

        PublicProduitResponse result = produitService.consulterProduitPublic(produitId);

        assertThat(result).isEqualTo(expected);
    }
}