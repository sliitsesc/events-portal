import {
  Html,
  Body,
  Head,
  Heading,
  Container,
  Text,
  Link,
  Tailwind,
} from "@react-email/components";

interface ApprovalEmailProps {
  studentName: string;
  eventName: string;
}

export default function ApprovalEmail({
  studentName,
  eventName,
}: ApprovalEmailProps) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-gray-100 font-sans">
          <Container className="bg-white mx-auto mt-10 p-8 rounded-lg shadow-md max-w-xl">
            <Heading className="text-2xl font-bold text-gray-900">
              Registration Approved! 🎉
            </Heading>
            <Text className="text-gray-700 text-lg mt-4">
              Hello {studentName},
            </Text>
            <Text className="text-gray-700 mt-2">
              Great news! Your registration for <strong>{eventName}</strong> has
              been officially approved by the SESC team.
            </Text>
            <Text className="text-gray-700 mt-4">
              Your digital QR ticket is now ready. Please have it open on your
              phone when you arrive at the auditorium doors so our volunteers
              can scan you in.
            </Text>

            <Link
              href="https://your-vercel-domain.com/my-events"
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md inline-block mt-6 no-underline"
            >
              View My QR Ticket
            </Link>

            <Text className="text-gray-500 text-sm mt-8">
              See you there!
              <br />- The SLIIT SESC Team
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
