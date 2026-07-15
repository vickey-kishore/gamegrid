package com.gamegrid.auction.controller;

import com.gamegrid.auction.entity.AuctionEventCategory;
import com.gamegrid.auction.entity.RosterCategoryConstraint;
import com.gamegrid.auction.repository.AuctionEventCategoryRepository;
import com.gamegrid.auction.repository.RosterCategoryConstraintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/options")
@RequiredArgsConstructor
public class OptionsController {

    private final AuctionEventCategoryRepository auctionEventCategoryRepository;
    private final RosterCategoryConstraintRepository rosterCategoryConstraintRepository;

    @GetMapping("/events")
    public ResponseEntity<List<String>> getEventCategories() {
        List<String> list = auctionEventCategoryRepository.findAll().stream()
                .map(AuctionEventCategory::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/roster-categories")
    public ResponseEntity<List<String>> getRosterCategories() {
        List<String> list = rosterCategoryConstraintRepository.findAll().stream()
                .map(RosterCategoryConstraint::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }
}
