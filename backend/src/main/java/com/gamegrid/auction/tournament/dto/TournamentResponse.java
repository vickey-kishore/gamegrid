package com.gamegrid.auction.tournament.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentResponse {
    private Long id;
    private String name;
    private String venue;
    private String logoPath;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal entryFee;
    private String organizerName;
    private String organizerContact;
    private String description;
    private int eventsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
