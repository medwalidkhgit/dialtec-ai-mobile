package com.dialtec.api_gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;


@Component //This Java class is developed to configure the filter
public class JwtValidationGlobalFilter implements GlobalFilter, Ordered {

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Value("${jwt.secret}")
    private String secret;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        String path = exchange.getRequest().getURI().getPath(); //Collecting the path from the request

        if (path.startsWith("/api/auth/")) {
            return chain.filter(exchange);
        }

        if (path.contains("/internal/")) {
            return rejectWith(exchange, HttpStatus.FORBIDDEN, "Accès interdit.");
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(AUTH_HEADER);
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            return rejectWith(exchange, HttpStatus.UNAUTHORIZED, "Token manquant.");
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            exchange.getAttributes().put("userId", claims.get("userId", String.class));
        } catch (JwtException e) {
            return rejectWith(exchange, HttpStatus.UNAUTHORIZED, "Token invalide ou expiré.");
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -1;
    }

    private Mono<Void> rejectWith(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add("Content-Type", "application/json");

        String body = String.format("{\"success\":false,\"message\":\"%s\"}", message);
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}