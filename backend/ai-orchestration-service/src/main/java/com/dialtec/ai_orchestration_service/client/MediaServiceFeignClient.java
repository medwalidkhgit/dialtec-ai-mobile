package com.dialtec.ai_orchestration_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "media-service", url = "${services.media-service.url}")
public interface MediaServiceFeignClient {

    @DeleteMapping("/api/media/internal")
    void deleteFile(@RequestParam("key") String key);
}