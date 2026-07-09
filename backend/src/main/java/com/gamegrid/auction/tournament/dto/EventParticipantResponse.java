package com.gamegrid.auction.tournament.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventParticipantResponse {
    private Long id;
    private Long eventId;
    private String participantName;
    private String player1Name;
    private String player2Name;
    private String clubName;
    private Integer seedNumber;
    private LocalDateTime createdAt;
}
