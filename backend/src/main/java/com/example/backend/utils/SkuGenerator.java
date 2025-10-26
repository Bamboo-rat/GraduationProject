package com.example.backend.utils;

import com.example.backend.entity.Category;
import com.example.backend.entity.Product;
import com.example.backend.entity.Supplier;
import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Random;
import java.util.stream.Collectors;

/**
 * Utility class for generating unique SKU (Stock Keeping Unit) codes for ProductVariants
 *
 * SKU Format: {SUPPLIER_CODE}-{CATEGORY_CODE}-{PRODUCT_ABBR}-{VARIANT_ABBR}-{UNIQUE_SUFFIX}
 *
 * Example: "SUP1234-BEV-CCO-B15L-5678"
 * - SUP1234: Supplier code (from tax code or user ID)
 * - BEV: Category abbreviation
 * - CCO: Product name abbreviation
 * - B15L: Variant name abbreviation
 * - 5678: Random 4-digit unique suffix
 */
@Slf4j
@UtilityClass
public class SkuGenerator {

    private static final int MAX_SUPPLIER_CODE_LENGTH = 7;
    private static final int MAX_CATEGORY_CODE_LENGTH = 4;
    private static final int MAX_PRODUCT_ABBR_LENGTH = 5;
    private static final int MAX_VARIANT_ABBR_LENGTH = 6;
    private static final int UNIQUE_SUFFIX_LENGTH = 4;
    private static final Random RANDOM = new Random();

    /**
     * Generate a unique SKU for a product variant
     *
     * @param product The product entity
     * @param variantName The variant name (e.g., "Bottle 1.5L", "Size M")
     * @return Generated SKU string
     */
    public static String generateSku(Product product, String variantName) {
        Supplier supplier = product.getSupplier();
        Category category = product.getCategory();

        String supplierCode = generateSupplierCode(supplier);
        String categoryCode = generateCategoryCode(category);
        String productAbbr = generateProductAbbreviation(product.getName());
        String variantAbbr = generateVariantAbbreviation(variantName);
        String uniqueSuffix = generateUniqueSuffix();

        String sku = String.format("%s-%s-%s-%s-%s",
            supplierCode, categoryCode, productAbbr, variantAbbr, uniqueSuffix);

        log.debug("Generated SKU: {} for product: {} variant: {}", sku, product.getName(), variantName);

        return sku.toUpperCase();
    }

    /**
     * Generate supplier code from tax code or user ID
     * Format: SUP + first 4 digits of tax code (or last 4 chars of user ID)
     *
     * @param supplier The supplier entity
     * @return Supplier code (e.g., "SUP1234")
     */
    private static String generateSupplierCode(Supplier supplier) {
        String code = "SUP";

        // Try to use tax code first
        if (supplier.getTaxCode() != null && !supplier.getTaxCode().trim().isEmpty()) {
            String taxCode = supplier.getTaxCode().replaceAll("[^0-9]", "");
            if (taxCode.length() >= 4) {
                code += taxCode.substring(0, 4);
            } else {
                // Pad with zeros if tax code is shorter
                code += String.format("%04d", Integer.parseInt(taxCode.isEmpty() ? "0" : taxCode));
            }
        } else {
            // Fallback to user ID (last 4 characters)
            String userId = supplier.getUserId();
            if (userId != null && userId.length() >= 4) {
                code += userId.substring(userId.length() - 4);
            } else {
                code += "0000";
            }
        }

        return truncate(code, MAX_SUPPLIER_CODE_LENGTH);
    }

    /**
     * Generate category code from category name
     * Takes first letter of each word (max 4 letters)
     *
     * @param category The category entity
     * @return Category code (e.g., "BEV" for "Beverages", "FF" for "Fast Food")
     */
    private static String generateCategoryCode(Category category) {
        if (category == null || category.getName() == null) {
            return "MISC";
        }

        String normalized = normalizeText(category.getName());
        String[] words = normalized.split("\\s+");

        if (words.length == 1) {
            // Single word: take first 3-4 characters
            return truncate(normalized, MAX_CATEGORY_CODE_LENGTH);
        } else {
            // Multiple words: take first letter of each word
            String code = Arrays.stream(words)
                .filter(word -> !word.isEmpty())
                .limit(MAX_CATEGORY_CODE_LENGTH)
                .map(word -> String.valueOf(word.charAt(0)))
                .collect(Collectors.joining());

            return code.isEmpty() ? "MISC" : code;
        }
    }

    /**
     * Generate product name abbreviation
     * Takes first letter of each word + some consonants
     *
     * @param productName The product name
     * @return Product abbreviation (e.g., "CCO" for "Coca Cola Original")
     */
    private static String generateProductAbbreviation(String productName) {
        if (productName == null || productName.trim().isEmpty()) {
            return "PROD";
        }

        String normalized = normalizeText(productName);
        String[] words = normalized.split("\\s+");

        if (words.length == 1) {
            // Single word: take consonants and some vowels
            return abbreviateSingleWord(normalized, MAX_PRODUCT_ABBR_LENGTH);
        } else {
            // Multiple words: take first letter of each word
            String abbr = Arrays.stream(words)
                .filter(word -> !word.isEmpty())
                .limit(MAX_PRODUCT_ABBR_LENGTH)
                .map(word -> String.valueOf(word.charAt(0)))
                .collect(Collectors.joining());

            return abbr.isEmpty() ? "PROD" : truncate(abbr, MAX_PRODUCT_ABBR_LENGTH);
        }
    }

    /**
     * Generate variant abbreviation
     * Handles common variant patterns like sizes, volumes, colors, etc.
     *
     * @param variantName The variant name (e.g., "Bottle 1.5L", "Size M", "Red Color")
     * @return Variant abbreviation (e.g., "B15L", "SM", "RCOL")
     */
    private static String generateVariantAbbreviation(String variantName) {
        if (variantName == null || variantName.trim().isEmpty()) {
            return "VAR";
        }

        String normalized = normalizeText(variantName);

        // Extract numbers (for sizes, volumes, etc.)
        String numbers = normalized.replaceAll("[^0-9.]", "");

        // Extract letters
        String letters = normalized.replaceAll("[^a-zA-Z\\s]", "").trim();

        String abbr;
        if (!numbers.isEmpty() && !letters.isEmpty()) {
            // Combination of letters and numbers (e.g., "Bottle 1.5L" -> "B15L")
            String letterAbbr = abbreviateSingleWord(letters.replaceAll("\\s+", ""), 2);
            String numberPart = numbers.length() > 3 ? numbers.substring(0, 3) : numbers;
            abbr = letterAbbr + numberPart.replace(".", "");
        } else if (!numbers.isEmpty()) {
            // Only numbers (e.g., "1.5" -> "15")
            abbr = "V" + numbers.replace(".", "");
        } else {
            // Only letters (e.g., "Red" -> "RED", "Size M" -> "SM")
            String[] words = letters.split("\\s+");
            if (words.length > 1) {
                abbr = Arrays.stream(words)
                    .filter(word -> !word.isEmpty())
                    .limit(3)
                    .map(word -> String.valueOf(word.charAt(0)))
                    .collect(Collectors.joining());
            } else {
                abbr = abbreviateSingleWord(letters, 4);
            }
        }

        return truncate(abbr.isEmpty() ? "VAR" : abbr, MAX_VARIANT_ABBR_LENGTH);
    }

    /**
     * Abbreviate a single word by taking consonants first, then vowels
     *
     * @param word The word to abbreviate
     * @param maxLength Maximum length of abbreviation
     * @return Abbreviated word
     */
    private static String abbreviateSingleWord(String word, int maxLength) {
        if (word.length() <= maxLength) {
            return word;
        }

        StringBuilder abbr = new StringBuilder();
        String vowels = "aeiouAEIOU";

        // First pass: Add first character
        if (!word.isEmpty()) {
            abbr.append(word.charAt(0));
        }

        // Second pass: Add consonants
        for (int i = 1; i < word.length() && abbr.length() < maxLength; i++) {
            char c = word.charAt(i);
            if (vowels.indexOf(c) == -1) {
                abbr.append(c);
            }
        }

        // Third pass: Add vowels if still under max length
        if (abbr.length() < maxLength) {
            for (int i = 1; i < word.length() && abbr.length() < maxLength; i++) {
                char c = word.charAt(i);
                if (vowels.indexOf(c) != -1 && abbr.indexOf(String.valueOf(c)) == -1) {
                    abbr.append(c);
                }
            }
        }

        return abbr.toString();
    }

    /**
     * Generate a unique suffix using random 4-digit number
     * This helps ensure uniqueness even for similar products/variants
     *
     * @return 4-digit random number as string
     */
    private static String generateUniqueSuffix() {
        // Generate random 4-digit number (1000-9999)
        int randomNum = 1000 + RANDOM.nextInt(9000);
        return String.valueOf(randomNum);
    }

    /**
     * Generate a unique suffix using timestamp-based approach
     * Alternative to random number for better uniqueness guarantee
     *
     * @return Last 4 digits of current timestamp
     */
    public static String generateTimestampBasedSuffix() {
        long timestamp = System.currentTimeMillis();
        String timestampStr = String.valueOf(timestamp);
        return timestampStr.substring(timestampStr.length() - UNIQUE_SUFFIX_LENGTH);
    }

    /**
     * Normalize text by removing accents and converting to ASCII
     * Handles Vietnamese characters
     *
     * @param text Text to normalize
     * @return Normalized text
     */
    private static String normalizeText(String text) {
        if (text == null) {
            return "";
        }

        // Remove accents and diacritics
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{M}", "");

        // Remove special characters except spaces and numbers
        normalized = normalized.replaceAll("[^a-zA-Z0-9\\s.]", "");

        // Collapse multiple spaces
        normalized = normalized.replaceAll("\\s+", " ").trim();

        return normalized;
    }

    /**
     * Truncate string to maximum length
     *
     * @param str String to truncate
     * @param maxLength Maximum length
     * @return Truncated string
     */
    private static String truncate(String str, int maxLength) {
        if (str == null || str.length() <= maxLength) {
            return str == null ? "" : str;
        }
        return str.substring(0, maxLength);
    }

    /**
     * Validate if a SKU format is valid
     *
     * @param sku The SKU to validate
     * @return true if SKU format is valid
     */
    public static boolean isValidSku(String sku) {
        if (sku == null || sku.trim().isEmpty()) {
            return false;
        }

        // SKU should have 5 parts separated by hyphens
        String[] parts = sku.split("-");
        return parts.length == 5;
    }
}
