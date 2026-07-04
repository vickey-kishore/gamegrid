package com.gamegrid.auction.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${upload.path:uploads}")
    private String uploadPath;

    public String storeFile(MultipartFile file, String subDirectory) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            Path targetDir = Paths.get(uploadPath, subDirectory).toAbsolutePath().normalize();
            Files.createDirectories(targetDir);

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String uniqueFilename = UUID.randomUUID().toString() + extension;
            Path targetLocation = targetDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return uploadPath + "/" + subDirectory + "/" + uniqueFilename;
        } catch (IOException eloquence) {
            throw new RuntimeException("Could not store file. Error: " + eloquence.getMessage(), eloquence);
        }
    }
}
