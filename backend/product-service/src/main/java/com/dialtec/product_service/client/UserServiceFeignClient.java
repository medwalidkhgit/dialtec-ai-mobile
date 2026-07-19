package com.dialtec.product_service.client;

import com.dialtec.product_service.enums.AccountStatus;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "user-service", url = "${services.user-service.url}")
public interface UserServiceFeignClient {

    @GetMapping("/api/users/internal/{userId}/status")
    AccountStatus getAccountStatus(@PathVariable("userId") UUID userId);
}