package com.dialtec.user_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {

    private long totalCommercants;
    private long totalClients;
    private long totalComptesBloques;
    private long totalComptesEnAttenteVerification;
}