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
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProduitServiceImpl implements ProduitService {

    private static final Logger log = LoggerFactory.getLogger(ProduitServiceImpl.class);

    private final ProduitRepository produitRepository;
    private final ProduitMapper produitMapper;
    private final ProduitGenerationPublisher produitGenerationPublisher;
    private final UserServiceFeignClient userServiceFeignClient;
    private final MediaServiceFeignClient mediaServiceFeignClient;

    @Override
    public UUID initierGeneration(UUID commercantId, GenerationRequest request) {
        AccountStatus statut;
        try {
            statut = userServiceFeignClient.getAccountStatus(commercantId);
        } catch (Exception e) {
            throw new ServiceIndisponibleException("Impossible de vérifier votre compte pour le moment, veuillez réessayer.");
        }

        if (statut != AccountStatus.ACTIF) {
            throw new CompteNonActifException("Votre compte doit être actif pour générer une fiche produit.");
        }

        return produitGenerationPublisher.publishGenerationRequest(
                commercantId, request.getPhotoUrl(), request.getPhotoKey(), request.getAudioUrl(), request.getAudioKey()
        );
    }

    @Override
    public ProduitResponse consulterParGenerationId(UUID commercantId, UUID generationId) {
        Produit produit = produitRepository.findByGenerationId(generationId)
                .orElseThrow(() -> new ProduitNotFoundException("Génération pas encore terminée, ou introuvable."));

        if (!produit.getCommercantId().equals(commercantId)) {
            throw new UnauthorizedProduitAccessException("Cette génération n'appartient pas à votre compte.");
        }

        return produitMapper.toProduitResponse(produit);
    }

    @Override
    public Page<ProduitResponse> listerMesProduits(UUID commercantId, String nom, String categorie, Pageable pageable) {
        return rechercherProduitsCommercant(commercantId, nom, categorie, pageable)
                .map(produitMapper::toProduitResponse);
    }

    @Override
    public ProduitResponse consulterMonProduit(UUID commercantId, UUID produitId) {
        return produitMapper.toProduitResponse(findProduitOwnedByOrThrow(commercantId, produitId));
    }

    @Override
    @Transactional
    public ProduitResponse modifierMonProduit(UUID commercantId, UUID produitId, ProduitUpdateRequest request) {
        Produit produit = findProduitOwnedByOrThrow(commercantId, produitId);
        produitMapper.applyUpdate(produit, request);
        produitRepository.save(produit);
        return produitMapper.toProduitResponse(produit);
    }

    @Override
    @Transactional
    public ProduitResponse validerMaFiche(UUID commercantId, UUID produitId) {
        Produit produit = findProduitOwnedByOrThrow(commercantId, produitId);
        produit.setStatut(StatutFiche.VALIDEE);
        produitRepository.save(produit);
        return produitMapper.toProduitResponse(produit);
    }

    @Override
    @Transactional
    public ProduitResponse mettreAJourStock(UUID commercantId, UUID produitId, StockUpdateRequest request) {
        Produit produit = findProduitOwnedByOrThrow(commercantId, produitId);
        produitMapper.applyStockUpdate(produit, request);
        produitRepository.save(produit);
        return produitMapper.toProduitResponse(produit);
    }

    @Override
    @Transactional
    public void supprimerMonProduit(UUID commercantId, UUID produitId) {
        Produit produit = findProduitOwnedByOrThrow(commercantId, produitId);

        // Récupérer les clés AVANT la suppression : la cascade va effacer
        // les lignes ProduitImage de la base, on n'aurait plus accès à
        // leurs clés une fois produitRepository.delete() exécuté.
        List<String> clesImages = produit.getImages().stream()
                .map(ProduitImage::getKey)
                .toList();

        produitRepository.delete(produit); // cascade supprime aussi ses ProduitImage en base

        clesImages.forEach(this::supprimerFichierEnBestEffort);
    }

    @Override
    @Transactional
    public ProduitResponse ajouterImage(UUID commercantId, UUID produitId, AjouterImageRequest request) {
        Produit produit = findProduitOwnedByOrThrow(commercantId, produitId);

        ProduitImage image = ProduitImage.builder()
                .produit(produit)
                .imageUrl(request.getImageUrl())
                .key(request.getImageKey())
                .ordre(produit.getImages().size())
                .estPrincipale(produit.getImages().isEmpty()) // la toute première devient principale par défaut
                .build();

        produit.getImages().add(image);
        produitRepository.save(produit);

        return produitMapper.toProduitResponse(produit);
    }

    @Override
    @Transactional
    public ProduitResponse supprimerImage(UUID commercantId, UUID produitId, UUID imageId) {
        Produit produit = findProduitOwnedByOrThrow(commercantId, produitId);

        ProduitImage imageASupprimer = produit.getImages().stream()
                .filter(image -> image.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> new ProduitNotFoundException("Aucune image trouvée avec cet identifiant pour ce produit."));

        produit.getImages().remove(imageASupprimer);
        produitRepository.save(produit);

        supprimerFichierEnBestEffort(imageASupprimer.getKey());

        return produitMapper.toProduitResponse(produit);
    }

    @Override
    public Page<PublicProduitResponse> listerCataloguePublic(String nom, String categorie, Pageable pageable) {
        return rechercherCataloguePublic(nom, categorie, pageable)
                .map(produitMapper::toPublicProduitResponse);
    }

    @Override
    public Page<PublicProduitResponse> listerCatalogueParCommercant(UUID commercantId, String categorie, Pageable pageable) {
        Page<Produit> page = (categorie != null && !categorie.isBlank())
                ? produitRepository.findByStatutAndCommercantIdAndCategorieIgnoreCase(StatutFiche.VALIDEE, commercantId, categorie, pageable)
                : produitRepository.findByStatutAndCommercantId(StatutFiche.VALIDEE, commercantId, pageable);

        return page.map(produitMapper::toPublicProduitResponse);
    }

    @Override
    public Page<PublicProduitResponse> listerNouveautesDeMesFournisseurs(UUID clientId, Pageable pageable) {
        List<UUID> fournisseurIds = userServiceFeignClient.getFournisseurIds(clientId);

        if (fournisseurIds.isEmpty()) {
            return Page.empty(pageable);
        }

        return produitRepository.findByStatutAndCommercantIdIn(StatutFiche.VALIDEE, fournisseurIds, pageable)
                .map(produitMapper::toPublicProduitResponse);
    }

    @Override
    public PublicProduitResponse consulterProduitPublic(UUID produitId) {
        Produit produit = produitRepository.findById(produitId)
                .filter(p -> p.getStatut() == StatutFiche.VALIDEE)
                .orElseThrow(() -> new ProduitNotFoundException("Aucun produit trouvé avec cet identifiant."));
        return produitMapper.toPublicProduitResponse(produit);
    }

    private Page<Produit> rechercherProduitsCommercant(UUID commercantId, String nom, String categorie, Pageable pageable) {
        if (nom != null && !nom.isBlank()) {
            return produitRepository.findByCommercantIdAndNomContainingIgnoreCase(commercantId, nom, pageable);
        }
        if (categorie != null && !categorie.isBlank()) {
            return produitRepository.findByCommercantIdAndCategorieIgnoreCase(commercantId, categorie, pageable);
        }
        return produitRepository.findByCommercantId(commercantId, pageable);
    }

    private Page<Produit> rechercherCataloguePublic(String nom, String categorie, Pageable pageable) {
        if (nom != null && !nom.isBlank()) {
            return produitRepository.findByStatutAndNomContainingIgnoreCase(StatutFiche.VALIDEE, nom, pageable);
        }
        if (categorie != null && !categorie.isBlank()) {
            return produitRepository.findByStatutAndCategorieIgnoreCase(StatutFiche.VALIDEE, categorie, pageable);
        }
        return produitRepository.findByStatut(StatutFiche.VALIDEE, pageable);
    }

    /**
     * Best-effort, volontairement : contrairement à la synchronisation
     * user-service/authentication-service (où la cohérence était critique,
     * un compte bloqué devant rester bloqué partout), un fichier orphelin
     * sur MinIO n'est qu'un gaspillage de stockage, pas un risque de
     * sécurité. Bloquer l'utilisateur parce que media-service est
     * temporairement indisponible serait une mauvaise expérience pour un
     * problème mineur — on logue pour un nettoyage manuel éventuel, sans
     * jamais annuler la suppression déjà faite en base.
     */
    private void supprimerFichierEnBestEffort(String key) {
        try {
            mediaServiceFeignClient.deleteFile(key);
        } catch (Exception e) {
            log.error("Échec de suppression du fichier physique sur media-service, key={}", key, e);
        }
    }

    private Produit findProduitOwnedByOrThrow(UUID commercantId, UUID produitId) {
        Produit produit = produitRepository.findById(produitId)
                .orElseThrow(() -> new ProduitNotFoundException("Aucun produit trouvé avec cet identifiant."));

        if (!produit.getCommercantId().equals(commercantId)) {
            throw new UnauthorizedProduitAccessException("Ce produit n'appartient pas à votre catalogue.");
        }

        return produit;
    }
}