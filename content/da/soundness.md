# Soundness battery

- planted mutants: 143
- lane B found a witness on: 70 (48 percent)
- witnessed mutants run through lane A: 70
- lane A verdicts on witnessed mutants: {"ASK:interface": 3, "ASK:lane-a-parent": 25, "ASK:no-lemma": 20, "ASK:translation-defect": 13, "ASK:unproved": 9}
- FALSE PASS (lane A proved a witnessed mutant equal): 0

| key | unit | class | mutation | lane B | lane A |
|---|---|---|---|---|---|
| nexus_3545 | UpsertRoleWorkloadUseCase.execute | nested | negated-if | WITNESS | ASK:no-lemma |
| nexus_3545 | UpsertRoleWorkloadUseCase.execute | nested | operator | WITNESS | ASK:no-lemma |
| nexus_408 | MessageProcessorService.processMessage | nested | string | ASK |  |
| nexus_408 | MessageProcessorService.processMessage | nested | string | ASK |  |
| nexus_408 | MessageProcessorService.processMessage | nested | dropped-effect | ASK |  |
| nexus_408 | ProfileContentPanel | effect | operator | ASK |  |
| nexus_408 | ProfileContentPanel | effect | boundary | ASK |  |
| nexus_408 | ProfileContentPanel | effect | boundary | ASK |  |
| nexus_408 | WorkflowPublishingService.publishWorkflow | nested | string | ASK |  |
| nexus_408 | WorkflowPublishingService.publishWorkflow | nested | string | ASK |  |
| nexus_408 | WorkflowPublishingService.publishWorkflow | nested | negated-if | ASK |  |
| nexus_408 | useGenerateVirtualEmployee | pure | string | WITNESS | ASK:no-lemma |
| nexus_408 | AgentToolConfigsService.deleteAllForAgent | nested | dropped-effect | ASK |  |
| nexus_408 | AgentToolConfigsService.deleteAllForAgent | nested | dropped-effect | ASK |  |
| nexus_408 | AgentToolConfigsService.deleteAllForAgent | nested | swapped-args | ASK |  |
| nexus_4244 | CheckoutGenerationSweepCronService.sweepWithInfrastructure | nested | string | WITNESS | ASK:lane-a-parent |
| nexus_7323 | asRecord | pure | operator | WITNESS | ASK:no-lemma |
| nexus_7323 | asRecord | pure | operator | WITNESS | ASK:no-lemma |
| nexus_7323 | asRecord | pure | operator | WITNESS | ASK:no-lemma |
| nexus_6963 | UpdateTaskUseCase.execute | nested | dropped-effect | WITNESS | ASK:no-lemma |
| nexus_6963 | UpdateTaskUseCase.execute | nested | dropped-effect | WITNESS | ASK:no-lemma |
| nexus_6963 | UpdateTaskUseCase.execute | nested | negated-if | WITNESS | ASK:no-lemma |
| nexus-1130 | EnhancedPluginNode.buildConstraintAwarePrompt | nested | string | ASK |  |
| nexus-1130 | EnhancedPluginNode.buildConstraintAwarePrompt | nested | string | ASK |  |
| nexus-1130 | EnhancedPluginNode.buildConstraintAwarePrompt | nested | string | ASK |  |
| nexus_4673 | PermissionCheckerService.getRoleGrantNarrowedOutResourceIds | nested | negated-if | ASK |  |
| nexus_4673 | PermissionCheckerService.getRoleGrantNarrowedOutResourceIds | nested | negated-if | ASK |  |
| nexus_4673 | PermissionCheckerService.getRoleGrantNarrowedOutResourceIds | nested | negated-if | ASK |  |
| nexus_5684 | reachesSelfJson | pure | negated-if | ASK |  |
| nexus_5684 | reachesSelfJson | pure | changed-return | ASK |  |
| nexus_5684 | reachesSelfJson | pure | operator | ASK |  |
| nexus_7601 | DaytonaSandboxRegistry.registerLiveRunner | nested | swapped-args | ASK |  |
| nexus_7601 | DaytonaSandboxRegistry.registerLiveRunner | nested | dropped-effect | ASK |  |
| nexus_7601 | DaytonaSandboxRegistry.registerLiveRunner | nested | dropped-effect | ASK |  |
| nexus_4244 | WorkspacesS3Client.deleteObject | nested | dropped-effect | WITNESS | ASK:no-lemma |
| nexus_7623 | projectGitHost | pure | negated-if | WITNESS | ASK:translation-defect |
| nexus_7623 | projectGitHost | pure | negated-if | WITNESS | ASK:translation-defect |
| nexus_7623 | projectGitHost | pure | operator | WITNESS | ASK:translation-defect |
| nexus_6963 | AgentMapper.toModelConfig | nested | operator | WITNESS | ASK:interface |
| nexus_6963 | AgentMapper.toModelConfig | nested | operator | WITNESS | ASK:interface |
| nexus_6963 | AgentMapper.toModelConfig | nested | operator | WITNESS | ASK:interface |
| nexus_408 | VirtualEmployeeVersionService.restoreVersion | nested | dropped-effect | ASK |  |
| nexus_408 | VirtualEmployeeVersionService.restoreVersion | nested | swapped-args | ASK |  |
| nexus_408 | VirtualEmployeeVersionService.restoreVersion | nested | negated-if | ASK |  |
| nexus-687 | ToolConnectionRepositoryAdapter.pollPipedreamAccounts | nested | negated-if | WITNESS | ASK:lane-a-parent |
| nexus-687 | ToolConnectionRepositoryAdapter.pollPipedreamAccounts | nested | operator | WITNESS | ASK:lane-a-parent |
| nexus-687 | ToolConnectionRepositoryAdapter.pollPipedreamAccounts | nested | boundary | PASS-bounded |  |
| nexus_4827 | McpEmbedToolsService.deliverCardMessage | nested | dropped-effect | ASK |  |
| nexus_4827 | McpEmbedToolsService.deliverCardMessage | nested | operator | ASK |  |
| nexus_4827 | McpEmbedToolsService.deliverCardMessage | nested | dropped-effect | ASK |  |
| nexus_2355 | CollectionsController.findOne | nested | swapped-args | ASK |  |
| nexus_408 | ExternalToolExecutor.refreshTokenExternalTool | nested | string | ASK |  |
| nexus_408 | ExternalToolExecutor.refreshTokenExternalTool | nested | string | ASK |  |
| nexus_408 | ExternalToolExecutor.refreshTokenExternalTool | nested | string | ASK |  |
| nexus-930 | LLMTracingService.startGeneration | nested | negated-if | WITNESS | ASK:lane-a-parent |
| nexus-930 | LLMTracingService.startGeneration | nested | dropped-else | WITNESS | ASK:lane-a-parent |
| nexus-930 | LLMTracingService.startGeneration | nested | dropped-effect | WITNESS | ASK:lane-a-parent |
| nexus_6963 | SendMessageUseCase.execute | nested | negated-if | WITNESS | ASK:no-lemma |
| nexus_6963 | SendMessageUseCase.execute | nested | operator | WITNESS | ASK:no-lemma |
| nexus_6963 | SendMessageUseCase.execute | nested | operator | WITNESS | ASK:no-lemma |
| nexus-754 | resolveTracingConfig | pure | string | PASS-bounded |  |
| nexus-754 | resolveTracingConfig | pure | negated-if | WITNESS | ASK:lane-a-parent |
| nexus-754 | resolveTracingConfig | pure | operator | WITNESS | ASK:lane-a-parent |
| nexus_7184 | DeleteAgentUseCase.execute | nested | swapped-args | WITNESS | ASK:unproved |
| nexus_7184 | DeleteAgentUseCase.execute | nested | operator | WITNESS | ASK:unproved |
| nexus_7184 | DeleteAgentUseCase.execute | nested | operator | WITNESS | ASK:unproved |
| nexus_6986 | PrismaDeploymentCrudRepository.create | nested | operator | ASK |  |
| nexus_6986 | PrismaDeploymentCrudRepository.create | nested | operator | ASK |  |
| nexus_6986 | PrismaDeploymentCrudRepository.create | nested | operator | ASK |  |
| nexus_3453 | V1ConversationsController.updateMetadata | nested | swapped-args | ASK |  |
| nexus_408 | AgentToolConfigsService.update | nested | swapped-args | ASK |  |
| nexus_408 | AgentToolConfigsService.update | nested | operator | ASK |  |
| nexus_408 | AgentToolConfigsService.update | nested | operator | ASK |  |
| nexus_728 | parseDeepEscapedJson | effect | boundary | WITNESS | ASK:lane-a-parent |
| nexus_728 | parseDeepEscapedJson | effect | operator | WITNESS | ASK:lane-a-parent |
| nexus_728 | parseDeepEscapedJson | effect | operator | WITNESS | ASK:lane-a-parent |
| nexus_5432 | ExternalApiOutageNotifierService.truncate | nested | changed-return | WITNESS | ASK:unproved |
| nexus_5432 | ExternalApiOutageNotifierService.truncate | nested | operator | WITNESS | ASK:unproved |
| nexus_5432 | ExternalApiOutageNotifierService.truncate | nested | swapped-args | WITNESS | ASK:unproved |
| nexus_6828 | AdminHealthController.checkEcho | nested | negated-if | ASK |  |
| nexus_6828 | AdminHealthController.checkEcho | nested | string | ASK |  |
| nexus_6828 | AdminHealthController.checkEcho | nested | string | ASK |  |
| nexus_7601 | DaytonaSandboxRegistry.setActiveLineConsumer | nested | string | ASK |  |
| nexus_7601 | DaytonaSandboxRegistry.setActiveLineConsumer | nested | string | ASK |  |
| nexus_7601 | DaytonaSandboxRegistry.setActiveLineConsumer | nested | string | ASK |  |
| pyka-d48b7fa | BudgetField | pure | boundary | WITNESS | ASK:translation-defect |
| pyka-d48b7fa | BudgetField | pure | string | WITNESS | ASK:translation-defect |
| pyka-d48b7fa | BudgetField | pure | string | WITNESS | ASK:translation-defect |
| nexus_408 | ChatsController.updateChatStatuses | nested | swapped-args | ASK |  |
| nexus-1130 | ProfilePictureGenerationService.generate | nested | string | WITNESS | ASK:lane-a-parent |
| nexus-1130 | ProfilePictureGenerationService.generate | nested | string | WITNESS | ASK:lane-a-parent |
| nexus-1130 | ProfilePictureGenerationService.generate | nested | negated-if | WITNESS | ASK:lane-a-parent |
| nexus_5432 | DashboardController.getFeedback | nested | negated-if | WITNESS | ASK:lane-a-parent |
| nexus_5432 | DashboardController.getFeedback | nested | operator | WITNESS | ASK:lane-a-parent |
| nexus_5432 | DashboardController.getFeedback | nested | string | WITNESS | ASK:lane-a-parent |
| nexus_6963 | calculateAnthropicMaxTokens | pure | changed-return | WITNESS | ASK:translation-defect |
| nexus_6963 | calculateAnthropicMaxTokens | pure | changed-return | WITNESS | ASK:translation-defect |
| nexus_6963 | calculateAnthropicMaxTokens | pure | changed-return | WITNESS | ASK:translation-defect |
| nexus_7296 | fromBase64url | pure | string | WITNESS | ASK:no-lemma |
| nexus_7296 | fromBase64url | pure | string | WITNESS | ASK:no-lemma |
| nexus_7296 | fromBase64url | pure | string | WITNESS | ASK:no-lemma |
| nexus_4244 | SourceMirrorWorkspaceStorageAdapter.getStats | nested | string | ASK |  |
| nexus_4244 | SourceMirrorWorkspaceStorageAdapter.getStats | nested | string | ASK |  |
| nexus_4244 | SourceMirrorWorkspaceStorageAdapter.getStats | nested | string | ASK |  |
| nexus_4244 | isRecord | pure | changed-return | WITNESS | ASK:unproved |
| nexus_4244 | isRecord | pure | operator | WITNESS | ASK:unproved |
| nexus_4244 | isRecord | pure | operator | WITNESS | ASK:unproved |
| nexus_3453 | PrismaChatRepository.createWhatsappMessage | nested | swapped-args | ASK |  |
| nexus_408 | useGetWorkflowUsageDetails | pure | operator | WITNESS | ASK:no-lemma |
| nexus_408 | useGetWorkflowUsageDetails | pure | operator | WITNESS | ASK:no-lemma |
| nexus_4244 | SandboxTurn.prepareTurn | nested | dropped-effect | ASK |  |
| nexus_4244 | SandboxTurn.prepareTurn | nested | dropped-effect | ASK |  |
| nexus_6828 | AdminHealthController.getInternalHealth | nested | dropped-effect | ASK |  |
| nexus_6828 | AdminHealthController.getInternalHealth | nested | dropped-effect | ASK |  |
| nexus_6828 | AdminHealthController.getInternalHealth | nested | dropped-effect | ASK |  |
| nexus_408 | useUpdateVirtualEmployee | pure | string | WITNESS | ASK:no-lemma |
| nexus_7024 | attemptKeyOfCodeBuild | pure | operator | WITNESS | ASK:no-lemma |
| nexus_7024 | attemptKeyOfCodeBuild | pure | operator | PASS-bounded |  |
| nexus_3453 | ResolveConversationIdPipe.transform | nested | negated-if | WITNESS | ASK:lane-a-parent |
| nexus_3453 | ResolveConversationIdPipe.transform | nested | operator | WITNESS | ASK:lane-a-parent |
| nexus_3453 | ResolveConversationIdPipe.transform | nested | operator | WITNESS | ASK:lane-a-parent |
| nexus_408 | WorkflowExecutionHistoryService.getWorkflowNodeTestResult | nested | string | WITNESS | ASK:lane-a-parent |
| nexus_408 | WorkflowExecutionHistoryService.getWorkflowNodeTestResult | nested | string | WITNESS | ASK:lane-a-parent |
| nexus_408 | WorkflowExecutionHistoryService.getWorkflowNodeTestResult | nested | negated-if | PASS-bounded |  |
| nexus_7022 | largestReservation | pure | swapped-args | PASS-bounded |  |
| nexus_7022 | largestReservation | pure | swapped-args | PASS-bounded |  |
| nexus_7022 | largestReservation | pure | boundary | WITNESS | ASK:translation-defect |
| nexus_3453 | WorkflowService.executeWorkflowFromSchedule | nested | negated-if | ASK |  |
| nexus_3453 | WorkflowService.executeWorkflowFromSchedule | nested | negated-if | ASK |  |
| nexus_4244 | SourceMirrorWorkspaceStorageAdapter.keyToRelativePath | nested | changed-return | ASK |  |
| nexus_4244 | SourceMirrorWorkspaceStorageAdapter.keyToRelativePath | nested | changed-return | ASK |  |
| nexus_7623 | projectTelemetry | pure | negated-if | WITNESS | ASK:translation-defect |
| nexus_7623 | projectTelemetry | pure | negated-if | WITNESS | ASK:translation-defect |
| nexus_7623 | projectTelemetry | pure | operator | WITNESS | ASK:translation-defect |
| nexus-754 | VoiceRelayGateway.cleanupSession | nested | negated-if | WITNESS | ASK:lane-a-parent |
| nexus-754 | VoiceRelayGateway.cleanupSession | nested | dropped-effect | WITNESS | ASK:lane-a-parent |
| nexus-754 | VoiceRelayGateway.cleanupSession | nested | dropped-effect | WITNESS | ASK:lane-a-parent |
| nexus-1321 | AITaskBaseStrategy.generateAndEnhancePrompt | nested | operator | PASS-bounded |  |
| nexus-1321 | AITaskBaseStrategy.generateAndEnhancePrompt | nested | operator | PASS-bounded |  |
| nexus-1321 | AITaskBaseStrategy.generateAndEnhancePrompt | nested | operator | PASS-bounded |  |
| nexus_4244 | SourceMirrorWorkspaceStorageAdapter.restoreOneKey | nested | negated-if | ASK |  |
| nexus_4244 | SourceMirrorWorkspaceStorageAdapter.restoreOneKey | nested | negated-if | ASK |  |
| nexus_4244 | SourceMirrorWorkspaceStorageAdapter.restoreOneKey | nested | negated-if | ASK |  |
