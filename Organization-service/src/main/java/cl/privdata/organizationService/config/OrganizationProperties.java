package cl.privdata.organizationService.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "organization")
public class OrganizationProperties {
    private String id;
    private String name;
    private String legalName;
    private String rut;
    private String businessType;
    private String email;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLegalName() { return legalName; }
    public void setLegalName(String legalName) { this.legalName = legalName; }

    public String getRut() { return rut; }
    public void setRut(String rut) { this.rut = rut; }

    public String getBusinessType() { return businessType; }
    public void setBusinessType(String businessType) { this.businessType = businessType; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
