package com.dialtec.authentication_service.security;

import com.dialtec.authentication_service.entity.AuthUser;
import com.dialtec.authentication_service.repository.AuthUserRepository;
import com.dialtec.authentication_service.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthentificationFilter extends OncePerRequestFilter {

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final AuthUserRepository authUserRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader(AUTH_HEADER);

        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        try {
            String email = jwtService.extractEmail(token);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                Optional<AuthUser> authUserOpt = authUserRepository.findByEmail(email);

                if (authUserOpt.isPresent() && jwtService.isTokenValid(token, email)) {
                    CustomUserDetails userDetails = new CustomUserDetails(authUserOpt.get());

                    // Revérifié depuis la base à chaque requête plutôt que depuis
                    // le seul contenu du token : un compte bloqué entre-temps est
                    // rejeté immédiatement, sans attendre l'expiration du token.
                    if (userDetails.isEnabled() && userDetails.isAccountNonLocked()) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            }
        } catch (Exception e) {
            // Token invalide, expiré ou malformé : la requête continue sans
            // authentification, Spring Security la rejettera (401) si
            // l'endpoint appelé nécessite d'être authentifié.
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}