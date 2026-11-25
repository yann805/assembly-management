import { AssemblyMembership, Member, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  // 1. Rôles
  const roleGeneralTreasury = await prisma.role.upsert({
    where: { name: 'GENERAL_TREASURY' },
    update: {},
    create: { name: 'GENERAL_TREASURY', description: 'Trésorerie générale / Administrateur principal' },
  });

  const roleAssemblyLeader = await prisma.role.upsert({
    where: { name: 'ASSEMBLY_LEADER' },
    update: {},
    create: { name: 'ASSEMBLY_LEADER', description: 'Dirigeant d\'assemblée' },
  });

  const roleAssemblyTreasurer = await prisma.role.upsert({
    where: { name: 'ASSEMBLY_TREASURER' },
    update: {},
    create: { name: 'ASSEMBLY_TREASURER', description: 'Trésorier d\'assemblée' },
  });

  // 2. Données de référence
  const maritalSingle = await prisma.maritalStatus.upsert({
    where: { name: 'Célibataire' },
    update: {},
    create: { name: 'Célibataire' },
  });
  await prisma.maritalStatus.upsert({ where: { name: 'Marié(e)' }, update: {}, create: { name: 'Marié(e)' } });
  await prisma.maritalStatus.upsert({ where: { name: 'Veuf(ve)' }, update: {}, create: { name: 'Veuf(ve)' } });

  await prisma.filiere.upsert({ where: { name: 'Hommes' }, update: {}, create: { name: 'Hommes' } });
  await prisma.filiere.upsert({ where: { name: 'Femmes' }, update: {}, create: { name: 'Femmes' } });
  await prisma.filiere.upsert({ where: { name: 'Jeunesse' }, update: {}, create: { name: 'Jeunesse' } });

  await prisma.level.upsert({ where: { name: 'Nouveau converti' }, update: {}, create: { name: 'Nouveau converti' } });
  await prisma.level.upsert({ where: { name: 'Membre actif' }, update: {}, create: { name: 'Membre actif' } });
  await prisma.level.upsert({ where: { name: 'Diacre' }, update: {}, create: { name: 'Diacre' } });

  // 3. Utilisateur administrateur principal
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@assembly.org' },
    update: {},
    create: {
      fullName: 'Administrateur Principal',
      email: 'admin@assembly.org',
      phone: '+22500000000',
      passwordHash: adminPassword,
      isActive: true,
    },
  });

  const existingAdminRole = await prisma.userRoleAssignment.findFirst({
    where: { userId: adminUser.id, roleId: roleGeneralTreasury.id },
  });
  if (!existingAdminRole) {
    await prisma.userRoleAssignment.create({
      data: {
        userId: adminUser.id,
        roleId: roleGeneralTreasury.id,
        assemblyId: null,
        assignedBy: adminUser.id,
      },
    });
  }

  // 4. Assemblée de démonstration
  let assembly = await prisma.assembly.findFirst({ where: { name: 'Assemblée Centrale' } });
  if (!assembly) {
    assembly = await prisma.assembly.create({
      data: {
        name: 'Assemblée Centrale',
        location: 'Abidjan, Côte d\'Ivoire',
        creationDate: new Date('2020-01-15'),
        status: 'ACTIVE',
        description: 'Assemblée principale de démonstration',
      },
    });
  }

  // 5. Membres de démonstration
  const members: Member[] = [];
  for (let i = 1; i <= 5; i++) {
    let member = await prisma.member.findFirst({ where: { fullName: `Membre ${i} Démo` } });
    if (!member) {
      member = await prisma.member.create({
        data: {
          fullName: `Membre ${i} Démo`,
          gender: i % 2 === 0 ? 'F' : 'M',
          dateOfBirth: new Date(1985 + i, 0, 10),
          conversionDate: new Date(2018 + i, 5, 1),
          waterBaptismDate: new Date(2019 + i, 3, 15),
          maritalStatusId: maritalSingle.id,
          profession: 'Profession ' + i,
          arrivalDate: new Date(2018 + i, 0, 1),
          status: 'ACTIVE',
          contacts: {
            create: [{ contactValue: `+2250700000${i}0`, contactType: 'PHONE', isPrimary: true }],
          },
        },
        include: { contacts: true },
      });
    }
    members.push(member);
  }

  // 6. Appartenances
  const memberships: AssemblyMembership[] = [];
  for (const member of members) {
    let membership = await prisma.assemblyMembership.findFirst({
      where: { assemblyId: assembly.id, memberId: member.id },
    });
    if (!membership) {
      membership = await prisma.assemblyMembership.create({
        data: {
          assemblyId: assembly.id,
          memberId: member.id,
          joinedAt: new Date(2020, 0, 15),
          status: 'ACTIVE',
        },
      });
    }
    memberships.push(membership);
  }

  // 7. Trésorier de l'assemblée
  const treasurerPassword = await bcrypt.hash('Tresorier@123', 10);
  const treasurerUser = await prisma.user.upsert({
    where: { email: 'tresorier@assembly.org' },
    update: {
      fullName: 'Trésorier Démo',
      phone: '+225070000001',
      passwordHash: treasurerPassword,
      isActive: true,
      memberId: members[0].id,
    },
    create: {
      fullName: 'Trésorier Démo',
      email: 'tresorier@assembly.org',
      phone: '+225070000001',
      passwordHash: treasurerPassword,
      isActive: true,
      memberId: members[0].id,
    },
  });
  const existingTreasurerRole = await prisma.userRoleAssignment.findFirst({
    where: { userId: treasurerUser.id, roleId: roleAssemblyTreasurer.id, assemblyId: assembly.id },
  });
  if (!existingTreasurerRole) {
    await prisma.userRoleAssignment.create({
      data: {
        userId: treasurerUser.id,
        roleId: roleAssemblyTreasurer.id,
        assemblyId: assembly.id,
        assignedBy: adminUser.id,
      },
    });
  }
  const existingTreasurerResponsibility = await prisma.assemblyResponsibility.findFirst({
    where: { assemblyId: assembly.id, responsibilityType: 'TREASURER', isCurrent: true },
  });
  if (!existingTreasurerResponsibility) {
    await prisma.assemblyResponsibility.create({
      data: {
        assemblyId: assembly.id,
        membershipId: memberships[0].id,
        responsibilityType: 'TREASURER',
        startDate: new Date(2020, 0, 15),
        assignedBy: adminUser.id,
        isCurrent: true,
      },
    });
  }

  // 8. Dirigeant de l'assemblée
  const existingLeader = await prisma.assemblyResponsibility.findFirst({
    where: { assemblyId: assembly.id, responsibilityType: 'LEADER', isCurrent: true },
  });
  if (!existingLeader) {
    await prisma.assemblyResponsibility.create({
      data: {
        assemblyId: assembly.id,
        membershipId: memberships[1].id,
        responsibilityType: 'LEADER',
        startDate: new Date(2020, 0, 15),
        assignedBy: adminUser.id,
        isCurrent: true,
      },
    });
  }

  // 8b. Compte de démonstration du dirigeant
  const leaderPassword = await bcrypt.hash('Leader@123', 10);
  const leaderUser = await prisma.user.upsert({
    where: { email: 'leader@assembly.org' },
    update: {
      fullName: 'Responsable Démo',
      phone: '+225070000002',
      passwordHash: leaderPassword,
      isActive: true,
      memberId: members[1].id,
    },
    create: {
      fullName: 'Responsable Démo',
      email: 'leader@assembly.org',
      phone: '+225070000002',
      passwordHash: leaderPassword,
      isActive: true,
      memberId: members[1].id,
    },
  });
  const existingLeaderRole = await prisma.userRoleAssignment.findFirst({
    where: { userId: leaderUser.id, roleId: roleAssemblyLeader.id, assemblyId: assembly.id },
  });
  if (!existingLeaderRole) {
    await prisma.userRoleAssignment.create({
      data: {
        userId: leaderUser.id,
        roleId: roleAssemblyLeader.id,
        assemblyId: assembly.id,
        assignedBy: adminUser.id,
      },
    });
  }

  // 9. Rubriques financières
  const categories = [
    { name: 'Construction', description: 'Fonds de construction' },
    { name: 'Évangélisation', description: 'Fonds d\'évangélisation' },
    { name: 'Fonctionnement', description: 'Frais de fonctionnement' },
    { name: 'Assistance sociale', description: 'Aide aux nécessiteux' },
    { name: 'Missions', description: 'Soutien aux missions' },
  ];

  for (const cat of categories) {
    const existingCat = await prisma.offeringCategory.findUnique({ where: { name: cat.name } });
    if (existingCat) continue;
    await prisma.offeringCategory.create({
      data: {
        name: cat.name,
        description: cat.description,
        isActive: true,
        createdBy: adminUser.id,
      },
    });
  }

  console.log('✅ Seed terminé avec succès !');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👥 Comptes de connexion créés :');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 Administrateur : admin@assembly.org / Admin@123');
  console.log('💰 Trésorier     : tresorier@assembly.org / Tresorier@123');
  console.log('🏛️ Responsable   : leader@assembly.org / Leader@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Erreur de seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
