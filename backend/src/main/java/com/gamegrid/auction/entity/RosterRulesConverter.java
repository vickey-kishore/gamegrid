package com.gamegrid.auction.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.ArrayList;
import java.util.List;

@Converter
public class RosterRulesConverter implements AttributeConverter<List<RosterRule>, String> {
    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<RosterRule> attribute) {
        try {
            return attribute == null ? "[]" : mapper.writeValueAsString(attribute);
        } catch (Exception e) {
            return "[]";
        }
    }

    @Override
    public List<RosterRule> convertToEntityAttribute(String dbData) {
        try {
            if (dbData == null || dbData.isBlank()) {
                return new ArrayList<>();
            }
            return mapper.readValue(dbData, new TypeReference<List<RosterRule>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
