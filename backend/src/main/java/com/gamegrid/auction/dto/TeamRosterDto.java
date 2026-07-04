package com.gamegrid.auction.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamRosterDto {
    private Long teamId;
    private String teamName;
    private String logoPath;
    private BigDecimal purseAmount;
    private BigDecimal remainingPurse;
    private BigDecimal totalSpent;
    private int totalPlayersPurchased;
    private List<RosterPlayerDto> players;
}
