package com.gamegrid.auction.tournament.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventRequest {
    @NotBlank(message = "Event name is required")
    private String eventName;

    @NotBlank(message = "Event type is required (Singles or Doubles)")
    private String eventType;

    @NotBlank(message = "Fixture type is required (Knockout or League)")
    private String fixtureType;

    @NotBlank(message = "Scoring configuration type is required")
    private String scoringType;

    private Integer pointsPerSet;
    private Integer numberOfSets;
}
