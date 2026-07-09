package com.gamegrid.auction.tournament.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantRegistrationRequest {
    
    @NotBlank(message = "Player 1 name is required")
    private String player1Name;
    
    private String player2Name; // Optional (Required only for Doubles)
    
    private String clubName;
}
