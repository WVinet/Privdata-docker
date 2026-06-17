package cl.duoc.agenciaService.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Validación de JWT stateless: a diferencia de Auth-service, no reconsulta la BD —
 * confía en el claim "permissions" (que ya incluye los ROLE_xxx) emitido al loguearse.
 * Es el primer microservicio downstream del sistema que valida la firma del JWT,
 * porque su propio frontend llama directo (vía BFF) sin pasar por un flujo ya autenticado aguas arriba.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(getSignInKey())
                        .build()
                        .parseSignedClaims(authHeader.substring(7))
                        .getPayload();

                String email = claims.getSubject();
                String userId = claims.get("userId", String.class);
                @SuppressWarnings("unchecked")
                List<String> permissions = claims.get("permissions", List.class);

                List<GrantedAuthority> authorities = permissions == null
                        ? List.of()
                        : permissions.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());

                AgencyPrincipal principal = new AgencyPrincipal(userId, email);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException | IllegalArgumentException ex) {
                // token inválido/expirado: se deja sin autenticar, la regla del path decide si rechaza
            }
        }

        filterChain.doFilter(request, response);
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
