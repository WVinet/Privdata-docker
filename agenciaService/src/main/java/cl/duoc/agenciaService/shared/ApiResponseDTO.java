package cl.duoc.agenciaService.shared;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ApiResponseDTO<T> {
    private boolean success;
    private String message;
    private T data;
}
