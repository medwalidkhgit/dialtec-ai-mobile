package com.dialtec.media_service.service;

import com.dialtec.media_service.dto.response.UploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    UploadResponse upload(MultipartFile file, String folder);

    void delete(String key);
}