package com.gamegrid.auction.controller;

import com.gamegrid.auction.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "File Upload APIs", description = "Endpoints for uploading team logos and player photos")
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    @Operation(summary = "Upload a file (logo or photo)")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type) { // e.g., "logos" or "photos"

        if (!"logos".equalsIgnoreCase(type) && !"photos".equalsIgnoreCase(type)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Type must be either 'logos' or 'photos'"));
        }

        String path = fileStorageService.storeFile(file, type.toLowerCase());
        return ResponseEntity.ok(Map.of("path", path));
    }
}
