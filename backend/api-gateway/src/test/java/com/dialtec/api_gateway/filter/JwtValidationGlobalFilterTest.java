package com.dialtec.api_gateway.filter;

import com.dialtec.api_gateway.security.JwtValidationGlobalFilter;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import javax.crypto.SecretKey;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtValidationGlobalFilterTest {

    private static final String TEST_SECRET = "ceci-est-un-secret-de-test-suffisamment-long-pour-hmac-sha256";

    private JwtValidationGlobalFilter filter;
    private GatewayFilterChain chain;

    @BeforeEach
    void setUp() {
        filter = new JwtValidationGlobalFilter();
        ReflectionTestUtils.setField(filter, "secret", TEST_SECRET);

        chain = Mockito.mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());
    }

    @Test
    void filter_cheminAuth_laisseToujoursPasserSansVerifierDeToken() {
        ServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/auth/login").build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        verify(chain, times(1)).filter(exchange);
    }

    @Test
    void filter_cheminInternal_rejetteAvecForbiddenMemeAvecUnBonToken() {
        String token = genererTokenValide("user-123");
        ServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/users/internal/user-123/status")
                        .header("Authorization", "Bearer " + token)
                        .build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(chain, never()).filter(any());
    }

    @Test
    void filter_sansEnTeteAuthorization_rejetteAvecUnauthorized() {
        ServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/produits/catalogue").build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    @Test
    void filter_enTeteSansPrefixeBearer_rejetteAvecUnauthorized() {
        ServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/produits/catalogue")
                        .header("Authorization", "un-token-quelconque")
                        .build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    @Test
    void filter_tokenSignatureInvalide_rejetteAvecUnauthorized() {
        // Signé avec un AUTRE secret que celui attendu par le filtre —
        // simule un token falsifié ou provenant d'une source non fiable.
        SecretKey mauvaiseCle = Keys.hmacShaKeyFor("un-tout-autre-secret-completement-different-12345".getBytes());
        String tokenInvalide = Jwts.builder()
                .claim("userId", "user-123")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(mauvaiseCle)
                .compact();

        ServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/produits/catalogue")
                        .header("Authorization", "Bearer " + tokenInvalide)
                        .build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    @Test
    void filter_tokenExpire_rejetteAvecUnauthorized() {
        SecretKey cle = Keys.hmacShaKeyFor(TEST_SECRET.getBytes());
        String tokenExpire = Jwts.builder()
                .claim("userId", "user-123")
                .issuedAt(new Date(System.currentTimeMillis() - 7200000))
                .expiration(new Date(System.currentTimeMillis() - 3600000)) // expiré depuis 1h
                .signWith(cle)
                .compact();

        ServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/produits/catalogue")
                        .header("Authorization", "Bearer " + tokenExpire)
                        .build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    @Test
    void filter_tokenValide_extraitLUserIdEtLaisseContinuer() {
        String token = genererTokenValide("user-123");
        ServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/produits/catalogue")
                        .header("Authorization", "Bearer " + token)
                        .build());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.<String>getAttribute("userId")).isEqualTo("user-123");
        verify(chain, times(1)).filter(exchange);
    }

    private String genererTokenValide(String userId) {
        SecretKey cle = Keys.hmacShaKeyFor(TEST_SECRET.getBytes());
        return Jwts.builder()
                .claim("userId", userId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(cle)
                .compact();
    }
}