package com.dialtec.user_service.client;

import com.dialtec.user_service.enums.AccountStatus;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "authentication-service", url = "${services.authentication-service.url}")
public interface AuthServiceFeignClient {

    @PatchMapping("/api/auth/internal/{userId}/status")
    void syncAccountStatus(@PathVariable("userId") UUID userId, @RequestParam("status") AccountStatus status);

    @DeleteMapping("/api/auth/internal/{userId}")
    void deleteAuthUser(@PathVariable("userId") UUID userId);
}