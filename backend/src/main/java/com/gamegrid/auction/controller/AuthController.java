package com.gamegrid.auction.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/google")
    public Map<String, Object> authenticateGoogle(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        String bypassRole = request.get("bypassRole");
        if (bypassRole != null && !bypassRole.trim().isEmpty()) {
            // Demo/Bypass Login
            response.put("name", bypassRole.equalsIgnoreCase("CREATOR") ? "Demo Organizer" : "Demo Player");
            response.put("email", bypassRole.equalsIgnoreCase("CREATOR") ? "organizer@gamegrid.com" : "player@gamegrid.com");
            response.put("picture", null);
            response.put("role", bypassRole.toUpperCase());
            response.put("success", true);
            return response;
        }

        String bypassEmail = request.get("bypassEmail");
        if (bypassEmail != null && !bypassEmail.trim().isEmpty()) {
            String email = bypassEmail.trim();
            boolean isCreator = email.contains("admin") || 
                                email.contains("organizer") || 
                                email.contains("creator") || 
                                email.contains("kisho") || 
                                email.equalsIgnoreCase("vickeyvickey6666@gmail.com");
            
            response.put("name", isCreator ? "Sandbox Organizer" : "Sandbox Player");
            response.put("email", email);
            response.put("picture", null);
            response.put("role", isCreator ? "CREATOR" : "PLAYER");
            response.put("success", true);
            return response;
        }

        String idToken = request.get("idToken");
        if (idToken == null || idToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Google ID Token is required");
        }

        try {
            // Parse JWT payload chunk
            String[] chunks = idToken.split("\\.");
            if (chunks.length < 2) {
                throw new IllegalArgumentException("Invalid ID Token format");
            }
            
            Base64.Decoder decoder = Base64.getUrlDecoder();
            String payload = new String(decoder.decode(chunks[1]));
            
            ObjectMapper mapper = new ObjectMapper();
            Map<?, ?> jwtPayload = mapper.readValue(payload, Map.class);
            
            String email = (String) jwtPayload.get("email");
            String name = (String) jwtPayload.get("name");
            String picture = (String) jwtPayload.get("picture");
            
            response.put("email", email);
            response.put("name", name != null ? name : email);
            response.put("picture", picture);
            
            // Map role: allow passing preferred role
            String preferredRole = request.get("preferredRole");
            if (preferredRole != null && (preferredRole.equalsIgnoreCase("CREATOR") || preferredRole.equalsIgnoreCase("PLAYER"))) {
                response.put("role", preferredRole.toUpperCase());
            } else {
                if (email != null && (email.contains("admin") || 
                                      email.contains("organizer") || 
                                      email.contains("creator") || 
                                      email.contains("kisho") || 
                                      email.equalsIgnoreCase("vickeyvickey6666@gmail.com"))) {
                    response.put("role", "CREATOR");
                } else {
                    response.put("role", "PLAYER");
                }
            }
            response.put("success", true);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Token validation failed: " + e.getMessage());
        }

        return response;
    }
}
