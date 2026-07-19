package com.gamegrid.auction.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamConfig {
    private Long id; // Null for new teams during creation/update

    @NotBlank(message = "Team name is required")
    private String teamName;

    private String logoPath; // Set via upload

    @NotNull(message = "Purse amount is required")
    @DecimalMin(value = "0.01", message = "Purse amount must be greater than zero")
    private BigDecimal purseAmount;

    @NotNull(message = "Minimum players count is required")
    @Min(value = 1, message = "Minimum players must be greater than zero")
    private Integer minimumPlayers;

    private Integer maximumPlayers;

    private BigDecimal remainingPurse;
    private Integer playersCount;
}
