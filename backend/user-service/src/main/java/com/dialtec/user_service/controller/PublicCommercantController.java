package com.dialtec.user_service.controller;

import com.dialtec.user_service.dto.response.PublicCommercantResponse;
import com.dialtec.user_service.enums.ShopCategory;
import com.dialtec.user_service.service.UserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/public/commercants")
@RequiredArgsConstructor
public class PublicCommercantController {

    private final UserAccountService userAccountService;

    @GetMapping
    public ResponseEntity<Page<PublicCommercantResponse>> listerCommercants(
            @RequestParam(required = false) ShopCategory shopCategory,
            Pageable pageable) {
        return ResponseEntity.ok(userAccountService.listerCommercantsPublics(shopCategory, pageable));
    }
}