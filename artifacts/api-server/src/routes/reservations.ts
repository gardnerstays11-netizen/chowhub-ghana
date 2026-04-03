import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, reservationsTable, listingsTable, usersTable } from "@workspace/db";
import { authMiddleware } from "../lib/auth";
import { sendEmail, reservationConfirmationEmail } from "../lib/email";

const router: IRouter = Router();

router.post("/reservations", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { listingId, date, time, partySize, occasion, specialRequests } = req.body;

  const [reservation] = await db.insert(reservationsTable).values({
    listingId,
    userId,
    date,
    time,
    partySize,
    occasion: occasion ?? null,
    specialRequests: specialRequests ?? null,
  }).returning();

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (user && listing) {
    const emailContent = reservationConfirmationEmail({
      customerName: user.name,
      listingName: listing.name,
      date: reservation.date,
      time: reservation.time,
      partySize: reservation.partySize,
      occasion: reservation.occasion ?? undefined,
    });
    await sendEmail({ to: user.email, ...emailContent });
  }

  res.status(201).json({
    id: reservation.id,
    listingId: reservation.listingId,
    userId: reservation.userId,
    date: reservation.date,
    time: reservation.time,
    partySize: reservation.partySize,
    occasion: reservation.occasion,
    specialRequests: reservation.specialRequests,
    status: reservation.status,
    listingName: listing?.name ?? null,
    userName: user?.name ?? null,
    userPhone: user?.phone ?? null,
    createdAt: reservation.createdAt.toISOString(),
  });
});

router.get("/reservations/mine", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const reservations = await db.select({
    reservation: reservationsTable,
    listingName: listingsTable.name,
  }).from(reservationsTable)
    .leftJoin(listingsTable, eq(reservationsTable.listingId, listingsTable.id))
    .where(eq(reservationsTable.userId, userId))
    .orderBy(desc(reservationsTable.createdAt));

  res.json(reservations.map(r => ({
    id: r.reservation.id,
    listingId: r.reservation.listingId,
    userId: r.reservation.userId,
    date: r.reservation.date,
    time: r.reservation.time,
    partySize: r.reservation.partySize,
    occasion: r.reservation.occasion,
    specialRequests: r.reservation.specialRequests,
    status: r.reservation.status,
    listingName: r.listingName ?? null,
    userName: null,
    userPhone: null,
    createdAt: r.reservation.createdAt.toISOString(),
  })));
});

export default router;
