import type { OrganizationCreationDefaultsResource } from '@clerk/shared/types';
type CreateOrganizationScreenProps = {
    onCancel?: () => void;
    organizationCreationDefaults?: OrganizationCreationDefaultsResource | null;
};
export declare const CreateOrganizationScreen: (props: CreateOrganizationScreenProps) => import("@emotion/react/jsx-runtime").JSX.Element;
export {};
