import type { OrganizationCreationAdvisorySeverity, OrganizationCreationAdvisoryType, OrganizationCreationDefaultsJSON, OrganizationCreationDefaultsJSONSnapshot, OrganizationCreationDefaultsResource } from '@clerk/shared/types';
import { BaseResource } from './internal';
export declare class OrganizationCreationDefaults extends BaseResource implements OrganizationCreationDefaultsResource {
    advisory: {
        code: OrganizationCreationAdvisoryType;
        severity: OrganizationCreationAdvisorySeverity;
        meta: Record<string, string>;
    } | null;
    form: {
        name: string;
        slug: string;
        logo: string | null;
        blurHash: string | null;
    };
    constructor(data?: OrganizationCreationDefaultsJSON | OrganizationCreationDefaultsJSONSnapshot | null);
    protected fromJSON(data: OrganizationCreationDefaultsJSON | OrganizationCreationDefaultsJSONSnapshot | null): this;
    static retrieve(): Promise<OrganizationCreationDefaultsResource>;
    __internal_toSnapshot(): OrganizationCreationDefaultsJSONSnapshot;
}
