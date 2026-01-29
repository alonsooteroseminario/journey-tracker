import { Substep } from "@/types";
import { generateId } from "./storage";

/**
 * Parse a description with bullet points into substeps
 * Bullet points starting with • will be converted to individual substeps
 */
export function parseDescriptionToSubsteps(description: string): {
  cleanDescription: string;
  substeps: Substep[];
} {
  if (!description) {
    return { cleanDescription: "", substeps: [] };
  }

  // Split by lines and trim each line
  const lines = description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const substeps: Substep[] = [];
  const nonBulletLines: string[] = [];

  lines.forEach((line) => {
    // Check if line starts with bullet point (•, -, *, or numbered list)
    // More flexible regex to handle various bullet formats
    const bulletMatch = line.match(/^[•\-\*●]\s*(.+)$/);
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
    
    if (bulletMatch) {
      // Extract the bullet content
      const content = bulletMatch[1].trim();
      
      // Check if it's a sub-bullet (starts with a dash after main content)
      // This handles cases like "• - Something" or "• – Something"
      const isSubBullet = content.match(/^[-–]\s+(.+)$/);
      
      if (isSubBullet) {
        // If it's a sub-bullet, append to the last substep's description if exists
        if (substeps.length > 0) {
          const lastSubstep = substeps[substeps.length - 1];
          lastSubstep.description = lastSubstep.description 
            ? `${lastSubstep.description}\n- ${isSubBullet[1].trim()}`
            : `- ${isSubBullet[1].trim()}`;
        } else {
          // No previous substep, treat as regular line
          nonBulletLines.push(line);
        }
      } else {
        // Create new substep with the content as title
        substeps.push({
          id: generateId(),
          title: content,
          description: "",
          completed: false,
          order: substeps.length + 1,
        });
      }
    } else if (numberedMatch) {
      // Handle numbered lists (1. Something, 2. Something, etc.)
      const content = numberedMatch[1].trim();
      substeps.push({
        id: generateId(),
        title: content,
        description: "",
        completed: false,
        order: substeps.length + 1,
      });
    } else {
      // Not a bullet point, keep as description
      nonBulletLines.push(line);
    }
  });

  // If no substeps were created, return original description
  if (substeps.length === 0) {
    return { cleanDescription: description, substeps: [] };
  }

  // Create clean description from non-bullet lines
  const cleanDescription = nonBulletLines.join("\n").trim();

  return { cleanDescription, substeps };
}

/**
 * Apply substep parsing to a task object
 */
export function enhanceTaskWithSubsteps<T extends { description?: string; substeps?: Substep[] }>(
  task: T
): T {
  // Skip if task already has substeps defined
  if (task.substeps && task.substeps.length > 0) {
    return task;
  }

  // Skip if no description
  if (!task.description) {
    return task;
  }

  const { cleanDescription, substeps } = parseDescriptionToSubsteps(task.description);

  // Only update if substeps were found
  if (substeps.length > 0) {
    return {
      ...task,
      description: cleanDescription || task.description, // Keep original if clean is empty
      substeps,
    };
  }

  return task;
}
