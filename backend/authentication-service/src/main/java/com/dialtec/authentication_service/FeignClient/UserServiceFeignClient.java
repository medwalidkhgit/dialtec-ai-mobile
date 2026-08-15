package com.dialtec.authentication_service.FeignClient;

import com.dialtec.authentication_service.dto.user.ClientProfileCreationRequest;
import com.dialtec.authentication_service.dto.user.CommercantProfileCreationRequest;
import com.dialtec.authentication_service.enums.AccountStatus;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "user-service", url = "${services.user-service.url}")
public interface UserServiceFeignClient {

    @PostMapping("/api/users/internal/profiles/commercant")
    void createCommercantProfile(@RequestBody CommercantProfileCreationRequest request);

    @PostMapping("/api/users/internal/profiles/client")
    void createClientProfile(@RequestBody ClientProfileCreationRequest request);

    @PatchMapping("/api/users/internal/{userId}/status")
    void updateAccountStatus(@PathVariable("userId") UUID userId, @RequestParam("status") AccountStatus status);

    @PatchMapping("/api/users/internal/{userId}/email")
    void updateEmail(@PathVariable("userId") UUID userId, @RequestParam("email") String email);

    @DeleteMapping("/api/users/internal/{userId}")
    void deleteProfile(@PathVariable("userId") UUID userId);
}