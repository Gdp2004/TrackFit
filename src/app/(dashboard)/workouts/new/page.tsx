import { Card } from "@frontend/components/ui/Card";
import { WorkoutForm } from "@frontend/components/workout/WorkoutForm";

export default function NewWorkoutPage() {
    return (
        <div style={{ maxWidth: 640, margin: "0 auto" }} className="animate-fadeIn">
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1.5rem" }}>
                🏃 Pianifica allenamento
            </h1>
            <Card variant="elevated">
                <WorkoutForm />
            </Card>
        </div>
    );
}
