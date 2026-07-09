package com.gamegrid.auction.tournament.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventResponse {
    private Long id;
    private Long tournamentId;
    private String eventName;
    private String eventType;
    private String fixtureType;
    private String scoringType;
    private Integer pointsPerSet;
    private Integer numberOfSets;
    private int participantsCount;
    private boolean fixturesGenerated;
    private LocalDateTime createdAt;
}
