package cl.privdata.complianceService.controller;

import cl.privdata.complianceService.DTO.response.DataCategoryResponseDTO;
import cl.privdata.complianceService.model.DataCategory;
import cl.privdata.complianceService.repository.DataCategoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/compliance/data-categories")
public class DataCategoryController {

    private final DataCategoryRepository repository;

    public DataCategoryController(DataCategoryRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<DataCategoryResponseDTO>> getAll() {
        List<DataCategoryResponseDTO> result = repository.findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    private DataCategoryResponseDTO toResponse(DataCategory cat) {
        DataCategoryResponseDTO dto = new DataCategoryResponseDTO();
        dto.setId(cat.getId());
        dto.setName(cat.getName());
        dto.setDescription(cat.getDescription());
        dto.setSensitive(cat.isSensitive());
        dto.setActive(cat.isActive());
        return dto;
    }
}
