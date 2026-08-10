from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Text, Index, Integer, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import synonym

from database.base import Base


class TutorCourse(Base):
    __tablename__ = "tutor_courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String(50), default="beginner")
    level = synonym("difficulty")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class TutorLesson(Base):
    __tablename__ = "tutor_lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    course_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    order_num = Column(Integer, default=0)
    position = synonym("order_num")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class TutorQuestion(Base):
    __tablename__ = "tutor_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    lesson_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    question = Column(Text, nullable=False)
    options = Column(Text, nullable=False)
    correct_answer = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class TutorQuiz(Base):
    __tablename__ = "tutor_quizzes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    course_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    passing_score = Column(Integer, default=70)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class TutorQuizAttempt(Base):
    __tablename__ = "tutor_quiz_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    quiz_id = Column(UUID(as_uuid=True), nullable=False)
    score = Column(Integer, default=0)
    passed = Column(Boolean, default=False)
    attempt_num = Column(Integer, default=1)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_tutor_quiz_attempts_quiz_id', 'quiz_id'),
    )


class TutorProgress(Base):
    __tablename__ = "tutor_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), nullable=False)
    lessons_completed = Column(Integer, default=0)
    completed_lessons = synonym("lessons_completed")
    total_lessons = Column(Integer, default=0)
    completion_percent = Column(Integer, default=0)
    progress_percentage = synonym("completion_percent")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'course_id', name='uq_tutor_progress_user_course'),
    )
