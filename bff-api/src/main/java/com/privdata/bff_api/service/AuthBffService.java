package com.privdata.bff_api.service;

import com.privdata.bff_api.client.AuthClient;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthBffService {

    private final AuthClient authClient;

    public AuthBffService (AuthClient authClient){
        this.authClient = authClient;
    }

    //logica login
    public Map<String, Object> login (Map<String , Object> resquest){
        return authClient.login(resquest);
    }

    public Map<String, Object> me(String authorization){
        return authClient.me(authorization);
    }
}
