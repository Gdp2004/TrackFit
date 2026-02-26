// ============================================================
// ServiceFactory – centralizza il wiring delle dipendenze
// Ogni service è istanziato una sola volta (lazy singleton per request).
// Sostituisce le funzioni buildService() duplicate in ogni route.
// ============================================================

import { CreateUserManagerService } from "@/backend/application/service/user/CreateUserManagerService";
import { CreateCoachManagerService } from "@/backend/application/service/coach/CreateCoachManagerService";
import { CreateGymManagerService } from "@/backend/application/service/gym/CreateGymManagerService";
import { CreateWorkoutManagerService } from "@/backend/application/service/workout/CreateWorkoutManagerService";
import { CreateSubscriptionManagerService } from "@/backend/application/service/subscription/CreateSubscriptionManagerService";
import { CreateReportManagerService } from "@/backend/application/service/report/CreateReportManagerService";

import { UserSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/UserSupabaseAdapter";
import { CoachSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/CoachSupabaseAdapter";
import { GymSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/GymSupabaseAdapter";
import { GestoreSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/GestoreSupabaseAdapter";
import { WorkoutSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/WorkoutSupabaseAdapter";
import { SubscriptionSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/SubscriptionSupabaseAdapter";
import { PaymentSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/PaymentSupabaseAdapter";
import { CouponSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/CouponSupabaseAdapter";
import { AuditLogSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/AuditLogSupabaseAdapter";
import { ReportSupabaseAdapter } from "@/backend/infrastructure/adapter/out/supabase/ReportSupabaseAdapter";
import { SupabaseRealtimeNotificationAdapter } from "@/backend/infrastructure/adapter/out/notification/SupabaseRealtimeNotificationAdapter";

// External adapters
import { StripeAdapter } from "@/backend/infrastructure/adapter/out/external/StripeAdapter";

// ─── Singleton adapters (stateless, safe to share) ─────────────────────────
const userRepo = new UserSupabaseAdapter();
const coachRepo = new CoachSupabaseAdapter();
const gymRepo = new GymSupabaseAdapter();
const gestoreRepo = new GestoreSupabaseAdapter();
const workoutRepo = new WorkoutSupabaseAdapter();
const subscriptionRepo = new SubscriptionSupabaseAdapter();
const paymentRepo = new PaymentSupabaseAdapter();
const couponRepo = new CouponSupabaseAdapter();
const auditRepo = new AuditLogSupabaseAdapter();
const reportRepo = new ReportSupabaseAdapter();
const notificationService = new SupabaseRealtimeNotificationAdapter();
const stripeAdapter = new StripeAdapter();

// ─── Service factories ──────────────────────────────────────────────────────

export function getUserService(): CreateUserManagerService {
    return new CreateUserManagerService(userRepo);
}

export function getCoachService(): CreateCoachManagerService {
    // constructor: coachRepo, userRepo, notificationService, auditRepo, paymentGateway?, paymentRepo?
    return new CreateCoachManagerService(coachRepo, userRepo, notificationService, auditRepo, stripeAdapter, paymentRepo);
}

export function getGymService(): CreateGymManagerService {
    // constructor: gymRepo, subRepo, notificationService, auditRepo, coachRepo?
    return new CreateGymManagerService(gymRepo, subscriptionRepo, notificationService, auditRepo, coachRepo);
}

export function getWorkoutService(): CreateWorkoutManagerService {
    return new CreateWorkoutManagerService(workoutRepo, notificationService);
}

export function getSubscriptionService(): CreateSubscriptionManagerService {
    return new CreateSubscriptionManagerService(
        subscriptionRepo,
        stripeAdapter,
        paymentRepo,
        couponRepo,
        auditRepo
    );
}

export function getReportService(): CreateReportManagerService {
    return new CreateReportManagerService(reportRepo, userRepo);
}
