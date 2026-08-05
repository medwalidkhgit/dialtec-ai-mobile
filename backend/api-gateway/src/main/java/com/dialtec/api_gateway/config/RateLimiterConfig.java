package com.dialtec.api_gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimiterConfig {

    @Bean
    public KeyResolver keyResolver() {
        return exchange -> {
            String userId = exchange.getAttribute("userId");
            if (userId != null) {
                return Mono.just(userId);
            }

            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "inconnu";

            return Mono.just(ip);
        };
    }
}