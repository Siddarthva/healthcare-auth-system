import { AbilityBuilder, createMongoAbility, MongoAbility, ExtractSubjectType } from '@casl/ability';

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';
export type Subjects = 'Patient' | 'User' | 'Consent' | 'AuditLog' | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export function defineAbilityFor(user: { id: string; role: string }) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.role === 'ADMIN') {
        can('manage', 'all');
    } else if (user.role === 'DOCTOR') {
        can('read', 'Patient');
        can('update', 'Patient'); // Assume context check for assignment
        cannot('delete', 'Patient');
        can('read', 'Consent');
    } else if (user.role === 'NURSE') {
        can('read', 'Patient'); // Restricted in specific handlers
        can('read', 'Consent');
    } else if (user.role === 'PATIENT') {
        can('read', 'Patient'); // Restricted to self in handlers
        // Consents
        can('manage', 'Consent');
    }

    return build({ detectSubjectType: (item) => (item as Record<string, any>).__type as ExtractSubjectType<Subjects> });
}
