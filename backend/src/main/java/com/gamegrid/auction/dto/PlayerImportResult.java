package com.gamegrid.auction.dto;

import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerImportResult {
    private int totalRows;
    private int successfullyImported;
    private int duplicateRecords;
    private int failedRecords;
    
    @Builder.Default
    private List<String> errors = new ArrayList<>();
}
