package com.privdata.bff_api.service;

import com.privdata.bff_api.client.ArcoClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ArcoBffService {

    private final ArcoClient arcoClient;

    public Object findAll(String organizationId)               { return arcoClient.findAll(organizationId); }
    public Object findById(String id)                          { return arcoClient.findById(id); }
    public Object findByDataSubject(String dataSubjectId)      { return arcoClient.findByDataSubject(dataSubjectId); }
    public Object create(Map<String, Object> body)             { return arcoClient.create(body); }
    public Object updateStatus(String id, Map<String, Object> body) { return arcoClient.updateStatus(id, body); }
}
