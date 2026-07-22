package com.dialtec.product_service.messaging;

import com.dialtec.product_service.config.RabbitMQConfig;
import com.dialtec.product_service.entity.Produit;
import com.dialtec.product_service.entity.ProduitImage;
import com.dialtec.product_service.mapper.ProduitMapper;
import com.dialtec.product_service.repository.ProduitRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ProduitGenerationListener {

    private static final Logger log = LoggerFactory.getLogger(ProduitGenerationListener.class);

    private final ProduitRepository produitRepository;
    private final ProduitMapper produitMapper;

    @RabbitListener(queues = RabbitMQConfig.GENERATION_RESULT_QUEUE)
    @Transactional
    public void handleGenerationResult(ProduitGenerationResultMessage message) {
        if (!message.isSuccess()) {
            // Limitation actuelle connue : le commerçant n'est pas encore notifié
            // explicitement d'un échec — juste loggé pour l'instant. Une vraie
            // notification (ou un endpoint de suivi de statut) sera à ajouter
            // plus tard si le temps le permet.
            log.error("Échec de génération IA pour commercantId={}, generationId={} : {}",
                    message.getCommercantId(), message.getGenerationId(), message.getErrorMessage());
            return;
        }

        Produit produit = Produit.builder()
                .commercantId(message.getCommercantId())
                .nom(message.getNom())
                .description(message.getDescription())
                .categorie(produitMapper.normalizeCategorie(message.getCategorie()))
                .caracteristiques(message.getCaracteristiques())
                .prix(message.getPrix())
                .quantite(message.getQuantite() != null ? message.getQuantite() : 0)
                .build();

        ProduitImage image = ProduitImage.builder()
                .produit(produit)
                .imageUrl(message.getPhotoUrl())
                .key(message.getPhotoKey())
                .estPrincipale(true)
                .build();

        produit.getImages().add(image);

        produitRepository.save(produit);

        log.info("Fiche produit créée avec succès, id={}, commercantId={}", produit.getId(), message.getCommercantId());
    }
}