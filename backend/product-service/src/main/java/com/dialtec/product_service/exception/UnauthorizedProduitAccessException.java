package com.dialtec.product_service.exception;

public class UnauthorizedProduitAccessException extends RuntimeException {

    public UnauthorizedProduitAccessException(String message) {
        super(message);
    }
}