package com.gamegrid.auction.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RosterPlayerDto {
    private Long playerId;
    private String name;
    private String photoPath;
    private String category;
    private String skillLevel;
    private String club;
    private BigDecimal soldPrice;
    private boolean isRetained;
}
