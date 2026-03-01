import { PrismaClient, Role } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
    const password = await argon2.hash("Demo123!");

    // ======================
    // USERS
    // ======================
    const admin = await prisma.user.upsert({
        where: { email: "admin@demo.com" },
        update: { passwordHash: password, isVerified: true, status: "ACTIVE" },
        create: {
            name: "System Admin",
            email: "admin@demo.com",
            passwordHash: password,
            role: "ADMIN",
            status: "ACTIVE",
            isVerified: true,
        },
    });

    const doctor = await prisma.user.upsert({
        where: { email: "doctor@demo.com" },
        update: { passwordHash: password, isVerified: true, status: "ACTIVE" },
        create: {
            name: "Dr. Strange",
            email: "doctor@demo.com",
            passwordHash: password,
            role: "DOCTOR",
            status: "ACTIVE",
            isVerified: true,
        },
    });

    const nurse = await prisma.user.upsert({
        where: { email: "nurse@demo.com" },
        update: { passwordHash: password, isVerified: true, status: "ACTIVE" },
        create: {
            name: "Nurse Joy",
            email: "nurse@demo.com",
            passwordHash: password,
            role: "NURSE",
            status: "ACTIVE",
            isVerified: true,
        },
    });

    const patientUser = await prisma.user.upsert({
        where: { email: "patient@demo.com" },
        update: { passwordHash: password, isVerified: true, status: "ACTIVE" },
        create: {
            name: "John Doe",
            email: "patient@demo.com",
            passwordHash: password,
            role: "PATIENT",
            status: "ACTIVE",
            isVerified: true,
        },
    });

    // ======================
    // PATIENT RECORD
    // ======================
    const patient = await prisma.patient.upsert({
        where: { userId: patientUser.id },
        update: {},
        create: {
            userId: patientUser.id,
            dateOfBirth: new Date("1990-01-01"),
            medicalId: "MED-" + Date.now(),
            history: "Diabetes Type II, Allergy to Penicillin",
        },
    });

    // ======================
    // ASSIGNMENT
    // ======================
    // Note: Check if exists to prevent unique constraint error on re-seed
    const existingAssignment = await prisma.assignment.findFirst({
        where: { staffId: doctor.id, patientId: patient.id }
    });
    if (!existingAssignment) {
        await prisma.assignment.create({
            data: {
                staffId: doctor.id,
                patientId: patient.id,
            },
        });
    }

    // ======================
    // CONSENT
    // ======================
    const existingConsent = await prisma.consent.findFirst({
        where: { patientId: patientUser.id, staffId: nurse.id }
    });
    if (!existingConsent) {
        await prisma.consent.create({
            data: {
                patientId: patientUser.id, // User ID of the patient
                staffId: nurse.id,         // User ID of the nurse
            },
        });
    }

    // ======================
    // EMERGENCY ACCESS SAMPLE
    // ======================
    await prisma.emergencyAccess.create({
        data: {
            doctorId: doctor.id,
            patientId: patient.id,
            reason: "Emergency cardiac arrest",
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        },
    });

    console.log("💀 Demo data seeded successfully");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
