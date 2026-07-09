package com.gamegrid.auction.tournament.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentRequest {
    @NotBlank(message = "Tournament name is required")
    private String name;

    @NotBlank(message = "Venue is required")
    private String venue;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private String logoPath;

    @NotNull(message = "Entry fee is required")
    @DecimalMin(value = "0.0", message = "Entry fee must be non-negative")
    private BigDecimal entryFee;

    @NotBlank(message = "Organizer name is required")
    private String organizerName;

    @NotBlank(message = "Organizer contact number is required")
    private String organizerContact;

    private String description;
}
