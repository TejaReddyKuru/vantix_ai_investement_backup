"""Phase 2: Create AI tutor tables (courses, lessons, questions, quizzes, progress).

Revision ID: 0009_phase2_tutor
Revises: 0008_phase2_community
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0009_phase2_tutor"
down_revision = "0008_phase2_community"
branch_labels = None
seqrevision = None


def upgrade() -> None:
    # Create tutor_courses table
    op.create_table(
        "tutor_courses",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("level", sa.String(50), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create tutor_lessons table
    op.create_table(
        "tutor_lessons",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("course_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["course_id"], ["tutor_courses.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_tutor_lessons_course_id", "tutor_lessons", ["course_id"])

    # Create tutor_questions table
    op.create_table(
        "tutor_questions",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("lesson_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("question_type", sa.String(50), nullable=False),
        sa.Column("options", sa.JSON(), nullable=True),
        sa.Column("correct_answer", sa.String(255), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["lesson_id"], ["tutor_lessons.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_tutor_questions_lesson_id", "tutor_questions", ["lesson_id"])

    # Create tutor_quizzes table
    op.create_table(
        "tutor_quizzes",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("course_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("passing_score", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["course_id"], ["tutor_courses.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_tutor_quizzes_course_id", "tutor_quizzes", ["course_id"])

    # Create tutor_quiz_attempts table
    op.create_table(
        "tutor_quiz_attempts",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("quiz_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("passed", sa.Boolean(), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["quiz_id"], ["tutor_quizzes.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_tutor_quiz_attempts_user_id", "tutor_quiz_attempts", ["user_id"])
    op.create_index("idx_tutor_quiz_attempts_quiz_id", "tutor_quiz_attempts", ["quiz_id"])

    # Create tutor_progress table
    op.create_table(
        "tutor_progress",
        sa.Column("id", sa.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("completed_lessons", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("total_lessons", sa.Integer(), nullable=False),
        sa.Column("progress_percentage", sa.Integer(), nullable=False),
        sa.Column("quiz_score", sa.Integer(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["course_id"], ["tutor_courses.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "course_id"),
    )
    op.create_index("idx_tutor_progress_user_id", "tutor_progress", ["user_id"])


def downgrade() -> None:
    op.drop_index("idx_tutor_progress_user_id", "tutor_progress")
    op.drop_table("tutor_progress")
    op.drop_index("idx_tutor_quiz_attempts_quiz_id", "tutor_quiz_attempts")
    op.drop_index("idx_tutor_quiz_attempts_user_id", "tutor_quiz_attempts")
    op.drop_table("tutor_quiz_attempts")
    op.drop_index("idx_tutor_quizzes_course_id", "tutor_quizzes")
    op.drop_table("tutor_quizzes")
    op.drop_index("idx_tutor_questions_lesson_id", "tutor_questions")
    op.drop_table("tutor_questions")
    op.drop_index("idx_tutor_lessons_course_id", "tutor_lessons")
    op.drop_table("tutor_lessons")
    op.drop_table("tutor_courses")
