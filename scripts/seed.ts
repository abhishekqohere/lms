import bcrypt from "bcryptjs";
import dbConnect from "../src/lib/db/mongodb";
import User from "../src/models/User";
import Course from "../src/models/Course";
import Section from "../src/models/Section";
import Lecture from "../src/models/Lecture";

async function seed() {
  await dbConnect();

  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Section.deleteMany({}),
    Lecture.deleteMany({}),
  ]);

  const password = await bcrypt.hash("Password1", 12);

  const [admin, instructor, student] = await User.create([
    {
      name: "Admin User",
      email: "admin@learnhub.com",
      password,
      role: "admin",
      isApproved: true,
    },
    {
      name: "Jane Instructor",
      email: "instructor@learnhub.com",
      password,
      role: "instructor",
      isApproved: true,
      bio: "Full-stack developer with 10+ years of experience",
    },
    {
      name: "John Student",
      email: "student@learnhub.com",
      password,
      role: "student",
      isApproved: true,
    },
  ]);

  const course = await Course.create({
    title: "Complete Web Development Bootcamp",
    slug: "complete-web-development-bootcamp",
    description:
      "Learn HTML, CSS, JavaScript, React, Node.js and MongoDB from scratch. Build real-world projects and become a full-stack developer.",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    category: "Development",
    price: 49.99,
    level: "beginner",
    instructor: instructor._id,
    isPublished: true,
    enrollmentCount: 0,
  });

  const section1 = await Section.create({
    courseId: course._id,
    title: "Getting Started",
    order: 0,
  });

  const section2 = await Section.create({
    courseId: course._id,
    title: "Frontend Development",
    order: 1,
  });

  await Lecture.create([
    {
      sectionId: section1._id,
      courseId: course._id,
      title: "Welcome to the Course",
      description: "Introduction and course overview",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      duration: 300,
      order: 0,
      resources: [
        { title: "Course Syllabus", type: "link", url: "https://example.com/syllabus" },
      ],
    },
    {
      sectionId: section1._id,
      courseId: course._id,
      title: "Setting Up Your Environment",
      description: "Install Node.js, VS Code, and essential tools",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      duration: 600,
      order: 1,
    },
    {
      sectionId: section2._id,
      courseId: course._id,
      title: "HTML Fundamentals",
      description: "Learn the building blocks of the web",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      duration: 900,
      order: 0,
    },
  ]);

  const course2 = await Course.create({
    title: "UI/UX Design Masterclass",
    slug: "ui-ux-design-masterclass",
    description: "Master user interface and user experience design principles.",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
    category: "Design",
    price: 39.99,
    level: "intermediate",
    instructor: instructor._id,
    isPublished: true,
  });

  await Section.create({
    courseId: course2._id,
    title: "Design Principles",
    order: 0,
  });

  console.log("Seed completed!");
  console.log("\nDemo accounts (password: Password1):");
  console.log("  Admin:      admin@learnhub.com");
  console.log("  Instructor: instructor@learnhub.com");
  console.log("  Student:    student@learnhub.com");
  console.log(`\nCreated ${2} courses with lectures`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
