package com.privdata.authservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "titular")
public class TitularProperties {
    private String email;
    private String password;
    private String personId;

    public String getEmail()    { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPersonId() { return personId; }
    public void setPersonId(String personId) { this.personId = personId; }
}
