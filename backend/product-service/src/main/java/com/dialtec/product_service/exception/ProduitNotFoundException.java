package com.dialtec.product_service.exception;

public class ProduitNotFoundException extends RuntimeException {

    public ProduitNotFoundException(String message) {
        super(message);
    }
}