package com.dialtec.product_service.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProduitGenerationRequestMessage {

    private UUID generationId;
    private UUID commercantId;
    private String photoUrl;
    private String photoKey;
    private String audioUrl;
    private String audioKey;
}